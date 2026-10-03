import { useEffect, useRef } from "react";
import { useAuth as useClerkAuth } from "@clerk/react";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/lib/apiServices";

const CLERK_LINKED_KEY = "moe_clerk_linked";

/**
 * Keeps the MOE backend session in step with Clerk.
 *
 * - Clerk signed in + no MOE session → POST /auth/clerk-verify with the Clerk
 *   session token and store the returned MOE tokens (find-or-create on the server).
 * - Clerk signed out after we linked a session → clear the MOE session too.
 *
 * Renders nothing. Mount only when Clerk is enabled (inside both providers).
 */
const ClerkSessionBridge = () => {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth();
  const { isAuthenticated, isLoading, loginWithTokens, logout } = useAuth();
  const attemptedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || isLoading) return;

    if (isSignedIn && !isAuthenticated) {
      // One attempt per Clerk sign-in; avoids hammering the API on failure.
      const key = "signed-in";
      if (attemptedFor.current === key) return;
      attemptedFor.current = key;

      (async () => {
        try {
          const token = await getToken();
          if (!token) return;
          const res = await authService.clerkVerify(token);
          localStorage.setItem(CLERK_LINKED_KEY, "1");
          await loginWithTokens(res.token, res.refreshToken);
        } catch (err) {
          if (import.meta.env.DEV) console.warn("[MOE] Clerk → MOE session exchange failed", err);
        }
      })();
      return;
    }

    if (!isSignedIn) {
      attemptedFor.current = null;
      if (isAuthenticated && localStorage.getItem(CLERK_LINKED_KEY) === "1") {
        localStorage.removeItem(CLERK_LINKED_KEY);
        logout();
      }
    }
  }, [isLoaded, isSignedIn, isAuthenticated, isLoading, getToken, loginWithTokens, logout]);

  return null;
};

export default ClerkSessionBridge;
