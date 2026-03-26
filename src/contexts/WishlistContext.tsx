import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { wishlistService } from "@/lib/apiServices";

export interface WishlistItem {
  productId: number;
  productName: string;
  providerId: number;
  providerName: string;
  priceRange: { min: number; max: number };
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
    return saved ? JSON.parse(saved) : [];
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

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<WishlistItem[]>(readLocal);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    writeLocal(items);
  }, [items]);

  // Sync from backend on mount if authenticated
  useEffect(() => {
    if (!isAuthenticated()) return;
    setIsSyncing(true);
    wishlistService
      .list()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          const mapped: WishlistItem[] = res.data.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            providerId: i.providerId,
            providerName: i.providerName,
            priceRange: { min: i.priceMin, max: i.priceMax },
            currency: i.currency,
            category: i.category,
            imageUrl: i.imageUrl,
            styleTags: i.styleTags || [],
            addedAt: new Date(i.addedAt),
          }));
          setItems(mapped);
        }
      })
      .catch(() => {})
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
    [items]
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
