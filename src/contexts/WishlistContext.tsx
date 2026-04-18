import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { wishlistService, type WishlistItemApi } from "@/lib/apiServices";

export interface WishlistItem {
  productId: number;
  productName: string;
  providerId: number;
  providerName: string;
  /** Unified single price. Null when backend has not yet returned a price. */
  price: number | null;
  currency: string;
  category: string;
  imageUrl: string;
  styleTags: string[];
  addedAt: Date;
}

interface WishlistContextType {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  clearWishlist: () => void;
  getItemCount: () => number;
  isSyncing: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const STORAGE_KEY = "wishlist";

function readLocal(): WishlistItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved) as Array<Partial<WishlistItem> & { priceRange?: { min: number } }>;
    // Backwards-compat: legacy localStorage items had `priceRange.min` — promote to `price`.
    return parsed.map((it) => ({
      productId: Number(it.productId ?? 0),
      productName: String(it.productName ?? ""),
      providerId: Number(it.providerId ?? 0),
      providerName: String(it.providerName ?? ""),
      price: it.price ?? it.priceRange?.min ?? null,
      currency: String(it.currency ?? "NGN"),
      category: String(it.category ?? ""),
      imageUrl: String(it.imageUrl ?? "/placeholder.svg"),
      styleTags: Array.isArray(it.styleTags) ? it.styleTags : [],
      addedAt: it.addedAt ? new Date(it.addedAt as unknown as string) : new Date(),
    }));
  } catch {
    return [];
  }
}

function writeLocal(items: WishlistItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function isAuthenticated() {
  return !!localStorage.getItem("moe_access_token");
}

/**
 * COMPAT SHIM: backend may still return `priceRange` or `priceMin/priceMax`
 * instead of the agreed `price` field. Map all shapes safely so the rest of
 * the app only ever reads `item.price`. Logged in backend_MoeV1.md.
 */
function mapApiItem(i: WishlistItemApi): WishlistItem {
  const price =
    typeof i.price === "number"
      ? i.price
      : typeof i.priceMin === "number"
      ? i.priceMin
      : i.priceRange?.min ?? null;

  return {
    productId: i.productId,
    productName: i.productName,
    providerId: i.providerId,
    providerName: i.providerName,
    price,
    currency: i.currency,
    category: i.category,
    imageUrl: i.imageUrl,
    styleTags: i.styleTags || [],
    addedAt: new Date(i.addedAt),
  };
}

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  // For unauthenticated users we hydrate from localStorage; for authenticated
  // users the API is the source of truth and we wait for it.
  const [items, setItems] = useState<WishlistItem[]>(() =>
    isAuthenticated() ? [] : readLocal(),
  );
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Only persist locally for guests; authed users persist via the API.
    if (!isAuthenticated()) writeLocal(items);
  }, [items]);

  // Sync from backend on mount if authenticated
  useEffect(() => {
    if (!isAuthenticated()) return;
    setIsSyncing(true);
    wishlistService
      .list()
      .then((res) => {
        if (res?.data) {
          setItems(res.data.map(mapApiItem));
        }
      })
      .catch(() => {
        // Silent — user just sees an empty wishlist if the API is down.
      })
      .finally(() => setIsSyncing(false));
  }, []);

  const addItem = useCallback((item: WishlistItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.productId === item.productId)) return prev;
      return [...prev, item];
    });
    if (isAuthenticated()) wishlistService.add(item.productId).catch(() => {});
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
    if (isAuthenticated()) wishlistService.remove(productId).catch(() => {});
  }, []);

  const isInWishlist = useCallback(
    (productId: number) => items.some((item) => item.productId === productId),
    [items],
  );

  const clearWishlist = useCallback(() => {
    setItems([]);
  }, []);

  const getItemCount = useCallback(() => items.length, [items]);

  return (
    <WishlistContext.Provider
      value={{ items, addItem, removeItem, isInWishlist, clearWishlist, getItemCount, isSyncing }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
};
