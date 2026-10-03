import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/react";
import { shadcn } from "@clerk/themes";
import "@clerk/themes/shadcn.css";
import { CLERK_PUBLISHABLE_KEY, CLERK_ROUTES, isClerkEnabled } from "@/lib/clerk";

/**
 * Wraps the app in <ClerkProvider> when a publishable key is configured.
 * Without a key it renders children untouched so the legacy auth flow keeps working.
 */
const ClerkRoot = ({ children }: { children: ReactNode }) => {
  if (!isClerkEnabled || !CLERK_PUBLISHABLE_KEY) return <>{children}</>;

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      appearance={{ theme: shadcn }}
      signInUrl={CLERK_ROUTES.signIn}
      signUpUrl={CLERK_ROUTES.signUp}
      signInFallbackRedirectUrl={CLERK_ROUTES.afterAuth}
      signUpFallbackRedirectUrl={CLERK_ROUTES.afterAuth}
      afterSignOutUrl={CLERK_ROUTES.afterSignOut}
    >
      {children}
    </ClerkProvider>
  );
};

export default ClerkRoot;
