import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/react";
import { useAuth } from "@/contexts/AuthContext";
import { isClerkEnabled } from "@/lib/clerk";

/**
 * If the visitor already has a Clerk or MOE session, bounce them off /auth
 * instead of showing Clerk's "You're already signed in" toast with no action.
 * Clerk hooks live in a child so this file is safe when Clerk is disabled.
 */
const ClerkSignedInRedirect = () => {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useUser();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn || isAuthenticated) {
      navigate("/marketplace", { replace: true });
    }
  }, [isLoaded, isSignedIn, isAuthenticated, navigate]);

  return null;
};

const MoeSignedInRedirect = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/marketplace", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  return null;
};

export const AlreadySignedInRedirect = () =>
  isClerkEnabled ? <ClerkSignedInRedirect /> : <MoeSignedInRedirect />;
