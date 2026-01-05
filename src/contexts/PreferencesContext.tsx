import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface UserPreferences {
  categories: string[];
  budget: number;
  styles: string[];
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

const STORAGE_KEY = "moe_user_preferences";

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences({
          ...parsed,
          updatedAt: parsed.updatedAt ? new Date(parsed.updatedAt) : null,
        });
      } catch (e) {
        console.error("Error parsing preferences:", e);
      }
    }
  }, []);

  // Save preferences to localStorage whenever they change
  const savePreferences = (prefs: UserPreferences) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  };

  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    const updated = {
      ...preferences,
      ...newPreferences,
      updatedAt: new Date(),
    };
    setPreferences(updated);
    savePreferences(updated);
  };

  const clearPreferences = () => {
    setPreferences(defaultPreferences);
    localStorage.removeItem(STORAGE_KEY);
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
