import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { preferencesService } from "@/lib/apiServices";
import { useAuth } from "@/contexts/AuthContext";

export interface UserPreferences {
  categories: string[];
  budget: number;
  styles: string[];
  location?: string;
  updatedAt: Date | null;
}

interface PreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => void;
  clearPreferences: () => void;
  hasPreferences: boolean;
}

const defaultPreferences: UserPreferences = {
  categories: [],
  budget: 500000,
  styles: [],
  updatedAt: null,
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

// Per-user storage so two accounts on the same browser don't share preferences.
// Guests get no persistence at all — their selections live only in memory and
// disappear on reload / new tab.
const STORAGE_PREFIX = "moe_user_preferences:";
const LEGACY_STORAGE_KEY = "moe_user_preferences";
const keyFor = (userId: number | string) => `${STORAGE_PREFIX}${userId}`;

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  // One-time cleanup of the legacy shared key so a stale value from a previous
  // session doesn't leak into a different account.
  useEffect(() => {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }, []);

  // Load the current user's stored preferences whenever auth identity changes.
  // Guests are reset to defaults so the previous user's choices don't carry over.
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setPreferences(defaultPreferences);
      return;
    }
    const stored = localStorage.getItem(keyFor(user.id));
    if (!stored) {
      setPreferences(defaultPreferences);
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      setPreferences({
        ...defaultPreferences,
        ...parsed,
        updatedAt: parsed.updatedAt ? new Date(parsed.updatedAt) : null,
      });
    } catch (e) {
      console.error("Error parsing preferences:", e);
      setPreferences(defaultPreferences);
    }
  }, [isAuthenticated, user?.id]);

  // Save preferences to localStorage under the current user's key.
  // No-op for guests — preferences are session-only until they sign in.
  const savePreferences = (prefs: UserPreferences) => {
    if (!isAuthenticated || !user?.id) return;
    localStorage.setItem(keyFor(user.id), JSON.stringify(prefs));
  };

  // Mirror to backend (best-effort). Fails silently so guests + unbuilt
  // backend never block the UX. Documented in backendRequirements.md.
  const syncToServer = (prefs: UserPreferences) => {
    if (!isAuthenticated) return;
    preferencesService
      .update({
        categories: prefs.categories,
        styleTags: prefs.styles,
        budget: prefs.budget,
      })
      .catch(() => {});
  };

  // When the user logs in, push any locally-stored preferences to the server,
  // then keep the local mirror so the UI works instantly on next visit.
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    // Pull server prefs first; if absent, push local up.
    preferencesService
      .get()
      .then((server) => {
        if (server && (server.categories?.length || server.styleTags?.length)) {
          const merged: UserPreferences = {
            categories: server.categories ?? [],
            styles: server.styleTags ?? [],
            budget: server.budget ?? defaultPreferences.budget,
            location: preferences.location,
            updatedAt: server.updatedAt ? new Date(server.updatedAt) : new Date(),
          };
          setPreferences(merged);
          savePreferences(merged);
        } else if (preferences.categories.length || preferences.styles.length) {
          syncToServer(preferences);
        }
      })
      .catch(() => {
        if (preferences.categories.length || preferences.styles.length) {
          syncToServer(preferences);
        }
      });
    // Only run on auth flips, not on every preference edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    const updated = {
      ...preferences,
      ...newPreferences,
      updatedAt: new Date(),
    };
    setPreferences(updated);
    savePreferences(updated);
    syncToServer(updated);
  };

  const clearPreferences = () => {
    setPreferences(defaultPreferences);
    if (user?.id) localStorage.removeItem(keyFor(user.id));
    if (isAuthenticated) preferencesService.clear().catch(() => {});
  };

  const hasPreferences = preferences.categories.length > 0 || preferences.styles.length > 0;

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreferences, clearPreferences, hasPreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
};
