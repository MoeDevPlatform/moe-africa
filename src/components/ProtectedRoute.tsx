import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/lib/apiServices";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  redirectTo?: string;
}

const ProtectedRoute = ({ children, requiredRole, redirectTo = "/auth" }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== "admin") {
    return <Navigate to="/marketplace" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
