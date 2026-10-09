import { MoeApiError } from "./moeApi";

export const DUPLICATE_CREDENTIAL_MESSAGE = "Email or Password already in use";

export function isDuplicateCredentialError(err: unknown): boolean {
  const e =
    err instanceof MoeApiError
      ? err
      : (err as { status?: number; code?: string; message?: string } | null);

  if (!e) return false;
  if (e.status === 409) return true;

  const code = (e.code ?? "").toLowerCase();
  if (
    code.includes("conflict") ||
    code.includes("duplicate") ||
    code.includes("exists") ||
    code === "user_already_exists"
  ) {
    return true;
  }

  const msg = (e.message ?? "").toLowerCase();
  return (
    msg.includes("duplicate") ||
    msg.includes("conflict") ||
    msg.includes("already in use") ||
    msg.includes("already exists") ||
    msg.includes("email already") ||
    msg.includes("password already")
  );
}

export function resolveSignupErrorMessage(err: unknown): string {
  if (isDuplicateCredentialError(err)) return DUPLICATE_CREDENTIAL_MESSAGE;
  if (err instanceof MoeApiError) return err.message;
  const msg = (err as { message?: string })?.message;
  return msg || "Registration failed";
}

export function isRateLimitError(err: unknown): err is MoeApiError {
  return err instanceof MoeApiError && err.status === 429;
}

export function rateLimitMessage(err: unknown): string {
  if (err instanceof MoeApiError) return err.message;
  return "Too many requests. Please try again later.";
}
