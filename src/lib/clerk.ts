/**
 * Clerk configuration.
 *
 * Clerk is opt-in: when `VITE_CLERK_PUBLISHABLE_KEY` is absent the app runs on the
 * existing AuthContext / backend-token flow exactly as before. This lets us migrate
 * gradually without breaking current users.
 *
 * Only the *publishable* key belongs in client code — never the secret key.
 */
export const CLERK_APP_ID = "app_3KBVAlbswmiY6AGLwqAZrof82aM";

export const CLERK_PUBLISHABLE_KEY: string | undefined =
  (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined)?.trim() || undefined;

export const isClerkEnabled = Boolean(CLERK_PUBLISHABLE_KEY);

/** Routes used by Clerk redirects (SignInButton / SignUpButton / after sign-out). */
export const CLERK_ROUTES = {
  signIn: "/auth",
  signUp: "/auth?tab=signup",
  afterAuth: "/marketplace",
  afterSignOut: "/",
} as const;
