import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import {
  authService,
  CustomerProfile,
  UserRole,
  artisanService,
} from "@/lib/apiServices";

interface AuthContextType {
  user: CustomerProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isArtisan: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    role?: UserRole,
    serviceCategories?: string[],
  ) => Promise<void>;
  /** Persist tokens + hydrate profile (used by OTP verify + Google OAuth callback). */
  loginWithTokens: (token: string, refreshToken: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<CustomerProfile>) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = "moe_access_token";
const REFRESH_TOKEN_KEY = "moe_refresh_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authService.getProfile();
      // Hydrate artisanProfile if backend `/auth/profile` doesn't embed it.
      // We rely on artisanProfile.id elsewhere to detect self-views and hide
      // the "Message" button on the artisan's own storefront/products.
      if (profile && profile.role === "artisan" && !profile.artisanProfile?.id) {
        try {
          const ap = await artisanService.getMyProfile();
          if (ap?.id) {
            profile.artisanProfile = { ...(profile.artisanProfile ?? {}), ...ap } as typeof profile.artisanProfile;
            try { localStorage.setItem("moe_self_artisan_id", String(ap.id)); } catch { /* noop */ }
          }
        } catch { /* non-fatal */ }
      } else if (profile?.artisanProfile?.id) {
        try { localStorage.setItem("moe_self_artisan_id", String(profile.artisanProfile.id)); } catch { /* noop */ }
      }
      setUser(profile);
    } catch {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setUser(null);
    }
  }, []);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      refreshProfile().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshProfile]);

  const clearArtisanStash = () => {
    localStorage.removeItem("moe_artisan_cover_url");
    localStorage.removeItem("moe_artisan_store_url");
    localStorage.removeItem("moe_self_user_id");
  };

  const loginWithTokens = useCallback(async (token: string, refreshToken: string) => {
    clearArtisanStash();
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    await refreshProfile();
  }, [refreshProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login({ email, password });
    clearArtisanStash();
    localStorage.setItem(ACCESS_TOKEN_KEY, res.token);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
    setUser(res.user);
  }, []);

  const register = useCallback(async (
    name: string,
    email: string,
    password: string,
    role?: UserRole,
    serviceCategories?: string[],
  ) => {
    const res = await authService.register({ name, email, password, role, serviceCategories });
    clearArtisanStash();
    localStorage.setItem(ACCESS_TOKEN_KEY, res.token);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    authService.logout().catch(() => {});
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    // Clear per-artisan local stashes so the next account on this browser
    // doesn't inherit the previous user's cover/store images.
    localStorage.removeItem("moe_artisan_cover_url");
    localStorage.removeItem("moe_artisan_store_url");
    localStorage.removeItem("moe_self_user_id");
    // Clear messaging caches so the next account doesn't see prior drafts/list.
    Object.keys(localStorage)
      .filter((k) => k.startsWith("conversation_") || k.startsWith("conversations_") || k === "conversations")
      .forEach((k) => localStorage.removeItem(k));
    setUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<CustomerProfile>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isArtisan: user?.role === "artisan",
        isAdmin: user?.role === "admin",
        login,
        register,
        loginWithTokens,
        logout,
        updateUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
