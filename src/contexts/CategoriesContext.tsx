import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { categoriesService } from "@/lib/apiServices";
import {
  type CategoryDef,
  getCategoryIcon,
  DEFAULT_CATEGORY_TYPES,
} from "@/lib/categories";

interface CategoriesContextValue {
  categories: CategoryDef[];
  isLoading: boolean;
  refetchCategories: () => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextValue | undefined>(undefined);

function normalizeApiCategory(row: {
  id?: string;
  slug?: string;
  value?: string;
  label: string;
  icon?: string | null;
  iconKey?: string | null;
  sortOrder?: number;
  order?: number;
}): CategoryDef {
  const value = row.value ?? row.slug ?? "";
  const iconKey = row.iconKey ?? row.icon ?? null;
  return {
    id: row.id,
    value,
    label: row.label,
    iconKey,
    icon: getCategoryIcon(iconKey),
    order: row.order ?? row.sortOrder ?? 0,
    types: DEFAULT_CATEGORY_TYPES[value] ?? [],
  };
}

export const CategoriesProvider = ({ children }: { children: ReactNode }) => {
  const [categories, setCategories] = useState<CategoryDef[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const rows = await categoriesService.list();
      const normalized = (Array.isArray(rows) ? rows : [])
        .map(normalizeApiCategory)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setCategories(normalized);
    } catch {
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetchCategories();
  }, [refetchCategories]);

  const value = useMemo(
    () => ({ categories, isLoading, refetchCategories }),
    [categories, isLoading, refetchCategories],
  );

  return (
    <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>
  );
};

export const useCategories = (): CategoriesContextValue => {
  const ctx = useContext(CategoriesContext);
  if (!ctx) {
    throw new Error("useCategories must be used within CategoriesProvider");
  }
  return ctx;
};
