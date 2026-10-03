import { useEffect, useRef } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/react";
import { useAuth } from "@/contexts/AuthContext";
import { authService, CustomerProfile } from "@/lib/apiServices";

const CLERK_LINKED_KEY = "moe_clerk_linked";

function clerkToProvisional(user: {
  id: string;
  fullName: string | null;
  firstName: string | null;
  imageUrl: string;
  primaryEmailAddress?: { emailAddress: string } | null;
}): CustomerProfile {
  const email = user.primaryEmailAddress?.emailAddress ?? "";
  const name = user.fullName || user.firstName || email.split("@")[0] || "MOE user";
  return {
    id: 0,
    username: email.split("@")[0] || user.id,
    name,
    email,
    avatarUrl: user.imageUrl || undefined,
    role: "customer",
    createdAt: new Date().toISOString(),
    isClerkUser: true,
  };
}

/**
 * Keeps AuthContext in step with Clerk after Google OAuth.
 *
 * 1. As soon as Clerk reports signed-in, paint a provisional user so the
 *    navbar shows the avatar (even before MOE tokens exist).
 * 2. Exchange the Clerk session JWT via POST /auth/clerk-verify for real
 *    MOE access/refresh tokens and replace the provisional profile.
 * 3. When Clerk signs out after a linked session, clear the MOE session too.
 */
const ClerkSessionBridge = () => {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { user, isAuthenticated, isLoading, loginWithTokens, setProvisionalUser, logout } = useAuth();
  const exchangeInFlight = useRef(false);
  const lastExchangedClerkId = useRef<string | null>(null);

  // Immediate UI sync — don't wait on the backend.
  useEffect(() => {
    if (!isLoaded || !userLoaded || isLoading) return;
    if (!isSignedIn || !clerkUser) return;
    if (isAuthenticated && user && !user.isClerkUser) return;
    setProvisionalUser(clerkToProvisional(clerkUser));
  }, [
    isLoaded,
    userLoaded,
    isLoading,
    isSignedIn,
    clerkUser,
    isAuthenticated,
    user,
    setProvisionalUser,
  ]);

  // Exchange Clerk session → MOE tokens.
  useEffect(() => {
    if (!isLoaded || isLoading) return;

    if (!isSignedIn) {
      lastExchangedClerkId.current = null;
      exchangeInFlight.current = false;
      if (isAuthenticated && localStorage.getItem(CLERK_LINKED_KEY) === "1") {
        localStorage.removeItem(CLERK_LINKED_KEY);
        logout();
      }
      return;
    }

    // Already have a real MOE session for this Clerk user — nothing to do.
    if (isAuthenticated && user && !user.isClerkUser) {
      lastExchangedClerkId.current = clerkUser?.id ?? "linked";
      return;
    }

    const clerkId = clerkUser?.id ?? "signed-in";
    if (lastExchangedClerkId.current === clerkId || exchangeInFlight.current) return;
    exchangeInFlight.current = true;

    (async () => {
      try {
        const token = await getToken();
        if (!token) {
          // Clerk can take a beat to mint a JWT — allow a later attempt.
          exchangeInFlight.current = false;
          return;
        }
        const res = await authService.clerkVerify(token);
        localStorage.setItem(CLERK_LINKED_KEY, "1");
        await loginWithTokens(res.token, res.refreshToken);
        lastExchangedClerkId.current = clerkId;
      } catch (err) {
        // Keep the provisional Clerk UI; authenticated MOE APIs stay blocked
        // until verify succeeds (e.g. after a retry / page reload).
        if (import.meta.env.DEV) console.warn("[MOE] Clerk → MOE session exchange failed", err);
        // Allow retry on next effect tick (e.g. after network blip).
        exchangeInFlight.current = false;
      }
    })();
  }, [
    isLoaded,
    isSignedIn,
    isAuthenticated,
    isLoading,
    user,
    clerkUser?.id,
    getToken,
    loginWithTokens,
    logout,
  ]);

  return null;
};

export default ClerkSessionBridge;
