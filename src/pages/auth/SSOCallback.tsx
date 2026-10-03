import { Navigate } from "react-router-dom";
import { AuthenticateWithRedirectCallback } from "@clerk/react";
import { isClerkEnabled } from "@/lib/clerk";

/**
 * Landing route for Clerk's Google OAuth redirect. Clerk finishes the
 * sign-in/sign-up here (including sign-in ↔ sign-up transfer for new vs.
 * existing Google accounts) and then forwards to `redirectUrlComplete`.
 */
export default function SSOCallback() {
  if (!isClerkEnabled) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      <AuthenticateWithRedirectCallback
        signInUrl="/auth"
        signUpUrl="/auth?tab=signup"
        signInFallbackRedirectUrl="/marketplace"
        signUpFallbackRedirectUrl="/marketplace"
      />
    </div>
  );
}
