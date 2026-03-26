import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { cartService } from "@/lib/apiServices";

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

const STORAGE_KEY = "cart";

function readLocal(): CartItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function writeLocal(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function isAuthenticated() {
  return !!localStorage.getItem("moe_access_token");
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(readLocal);
  const [isSyncing, setIsSyncing] = useState(false);

  // Persist locally on every change
  useEffect(() => {
    writeLocal(items);
  }, [items]);

  // Sync from backend on mount if authenticated
  useEffect(() => {
    if (!isAuthenticated()) return;
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
          }));
          setItems(mapped);
        }
      })
      .catch(() => {/* keep local */})
      .finally(() => setIsSyncing(false));
  }, []);

  const syncAdd = useCallback((item: CartItem) => {
    if (!isAuthenticated()) return;
    cartService.add(item).catch(() => {});
  }, []);

  const syncRemove = useCallback((id: string) => {
    if (!isAuthenticated()) return;
    cartService.remove(id).catch(() => {});
  }, []);

  const syncUpdate = useCallback((id: string, item: CartItem) => {
    if (!isAuthenticated()) return;
    cartService.update(id, item).catch(() => {});
  }, []);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => [...prev, item]);
    syncAdd(item);
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
    if (isAuthenticated()) cartService.clear().catch(() => {});
  }, []);

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
