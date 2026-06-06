import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { cartService } from "@/lib/apiServices";
import { useAuth } from "@/contexts/AuthContext";
import { toast as sonnerToast } from "sonner";

export interface CartItem {
  id: string;
  productId: number;
  productName: string;
  providerId: number;
  providerName: string;
  basePrice: number;
  finalPrice: number;
  category: "tailoring" | "shoemaking" | "canvas";
  selectedSize?: string;
  selectedBodyType?: string;
  selectedVariants: Record<string, string>;
  measurements: Record<string, string>;
  notes: string;
  quantity: number;
  /** Issue #7 — primary product image stashed at add-time so cart can render it. */
  imageUrl?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateItem: (id: string, item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getTotalPrice: () => number;
  isSyncing: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/**
 * Per-user cart storage (no shared/guest key).
 *
 * The previous shared "cart" key leaked items between accounts on the same
 * browser. Guests now have no persisted cart; authenticated users get a
 * key scoped to their userId.
 */
const userCartKey = (userId: number | string) => `moe_cart_user_${userId}`;
const LEGACY_CART_KEY = "cart";

function readLocalKey(key: string): CartItem[] {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function writeLocalKey(key: string, items: CartItem[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Always wipe the legacy shared key — it leaked carts across accounts.
  useEffect(() => {
    localStorage.removeItem(LEGACY_CART_KEY);
  }, []);

  // Persist to the per-user key only when authenticated.
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    writeLocalKey(userCartKey(user.id), items);
  }, [items, isAuthenticated, user?.id]);

  // Load (or clear) on identity flip. Guests => empty in-memory, no persistence.
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setItems([]);
      localStorage.removeItem(LEGACY_CART_KEY);
      return;
    }
    // Seed from per-user local first for instant paint.
    setItems(readLocalKey(userCartKey(user.id)));
    setIsSyncing(true);
    cartService
      .list()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          const mapped: CartItem[] = res.data.map((i) => ({
            id: i.id,
            productId: i.productId,
            productName: i.productName,
            providerId: i.providerId,
            providerName: i.providerName,
            basePrice: i.basePrice,
            finalPrice: i.finalPrice,
            category: i.category as CartItem["category"],
            selectedSize: i.selectedSize,
            selectedBodyType: i.selectedBodyType,
            selectedVariants: i.selectedVariants || {},
            measurements: i.measurements || {},
            notes: i.notes || "",
            quantity: i.quantity,
            imageUrl: i.imageUrl,
          }));
          setItems(mapped);
        }
      })
      .catch(() => {/* keep local */})
      .finally(() => setIsSyncing(false));
  }, [isAuthenticated, user?.id]);

  const syncAdd = useCallback((item: CartItem) => {
    if (!isAuthenticated) return;
    cartService.add(item).catch(() => {});
  }, [isAuthenticated]);

  const syncRemove = useCallback((id: string) => {
    if (!isAuthenticated) return;
    cartService.remove(id).catch(() => {});
  }, [isAuthenticated]);

  const syncUpdate = useCallback((id: string, item: CartItem) => {
    if (!isAuthenticated) return;
    cartService.update(id, item).catch(() => {});
  }, [isAuthenticated]);

  const addItem = useCallback((item: CartItem) => {
    let added = false;
    setItems((prev) => {
      // Prevent duplicate entries for the same product.
      if (prev.some((i) => i.productId === item.productId)) {
        return prev;
      }
      added = true;
      return [...prev, item];
    });
    if (added) {
      syncAdd(item);
    } else {
      sonnerToast.info("This item is already in your cart");
    }
  }, [syncAdd]);

  const updateItem = useCallback((id: string, updatedItem: CartItem) => {
    setItems((prev) => prev.map((item) => (item.id === id ? updatedItem : item)));
    syncUpdate(id, updatedItem);
  }, [syncUpdate]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    syncRemove(id);
  }, [syncRemove]);

  const clearCart = useCallback(() => {
    setItems([]);
    if (isAuthenticated) cartService.clear().catch(() => {});
  }, [isAuthenticated]);

  const getItemCount = useCallback(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const getTotalPrice = useCallback(() => {
    return items.reduce((total, item) => total + item.finalPrice * item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateItem, removeItem, clearCart, getItemCount, getTotalPrice, isSyncing }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
