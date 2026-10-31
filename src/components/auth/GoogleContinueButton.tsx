import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import GoogleMark from "@/components/auth/GoogleMark";

type GoogleContinueButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

/** Light Google sign-in control: official G mark, full width, visible hover and focus. */
const GoogleContinueButton = ({
  loading = false,
  disabled,
  className,
  ...props
}: GoogleContinueButtonProps) => (
  <button
    type="button"
    className={cn(
      "inline-flex h-11 w-full items-center justify-center gap-3 rounded-md border border-[#747775] bg-white px-3 text-sm font-medium text-[#1f1f1f] transition-colors",
      "hover:bg-[#f7f8f8] hover:shadow-sm",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f1f1f] focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:hover:bg-white",
      className,
    )}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    {...props}
  >
    <GoogleMark className="h-[18px] w-[18px] shrink-0" />
    <span>{loading ? "Redirecting to Google..." : "Continue with Google"}</span>
  </button>
);

export default GoogleContinueButton;
