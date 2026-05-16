import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

/**
 * OAuth landing page (item 9). Backend's `GOOGLE_SUCCESS_REDIRECT` should
 * point here. Reads `token` + `refreshToken` from the URL, persists them,
 * hydrates the profile, then routes by role.
 */
const AuthCallback = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithTokens } = useAuth();

  useEffect(() => {
    const token = params.get("token");
    const refreshToken = params.get("refreshToken");
    const error = params.get("error");

    if (error) {
      toast.error(`Sign-in failed: ${error}`);
      navigate("/auth");
      return;
    }
    if (!token || !refreshToken) {
      toast.error("Sign-in failed — missing credentials");
      navigate("/auth");
      return;
    }

    loginWithTokens(token, refreshToken)
      .then(() => {
        toast.success("Signed in with Google");
        navigate("/marketplace");
      })
      .catch(() => {
        toast.error("Could not complete sign-in");
        navigate("/auth");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground gap-2">
      <Loader2 className="h-5 w-5 animate-spin" /> Completing sign-in…
    </div>
  );
};

export default AuthCallback;
