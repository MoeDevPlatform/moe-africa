import type { ReactNode } from "react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

interface ClerkNavAuthProps {
  /**
   * Rendered while Clerk reports the visitor as signed out. The navbar passes the
   * legacy AuthContext avatar here so users on the existing backend session still
   * see their profile menu during the gradual migration.
   */
  legacyAuthenticated?: ReactNode;
}

/** Clerk-powered navbar auth controls. Only render when Clerk is enabled. */
const ClerkNavAuth = ({ legacyAuthenticated }: ClerkNavAuthProps) => (
  <>
    <Show when="signed-in">
      <UserButton />
    </Show>
    <Show when="signed-out">
      {legacyAuthenticated ?? (
        <div className="hidden sm:flex items-center gap-2">
          <SignInButton>
            <Button variant="outline" size="sm" className="gap-2" aria-label="Sign in to your account">
              <User className="h-4 w-4" aria-hidden="true" />
              <span className="hidden lg:inline">Sign In</span>
            </Button>
          </SignInButton>
          <SignUpButton>
            <Button size="sm" className="hidden lg:inline-flex">Sign Up</Button>
          </SignUpButton>
        </div>
      )}
    </Show>
  </>
);

export default ClerkNavAuth;
