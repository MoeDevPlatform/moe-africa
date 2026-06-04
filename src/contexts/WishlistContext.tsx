import { FALLBACK_IMAGE } from "@/lib/imageFallback";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { wishlistService, type WishlistItemApi } from "@/lib/apiServices";
import { useAuth } from "@/contexts/AuthContext";

export interface WishlistItem {
  productId: number;
  /** Optional backend-issued wishlist row id, used as a delete fallback. */
  wishlistItemId?: number;
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

/**
 * Guest wishlist key (Sprint Task 3).
 *
 * The legacy shared "wishlist" key leaked across users on the same browser —
 * if User A signed out, User B saw A's wishlist. We now scope guest storage
 * to its own key and key user-specific fallback storage by userId so the two
 * never mix.
 */
const GUEST_KEY = "moe_wishlist_guest";
const userKey = (userId: number | string) => `moe_wishlist_user_${userId}`;
const LEGACY_KEY = "wishlist";

function readLocalKey(key: string): WishlistItem[] {
  try {
    const saved = localStorage.getItem(key);
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
      imageUrl: String(it.imageUrl ?? FALLBACK_IMAGE),
      styleTags: Array.isArray(it.styleTags) ? it.styleTags : [],
      addedAt: it.addedAt ? new Date(it.addedAt as unknown as string) : new Date(),
    }));
  } catch {
    return [];
  }
}

function writeLocalKey(key: string, items: WishlistItem[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

function migrateLegacyGuest() {
  // One-time migration: if the old shared key still exists, fold it into
  // the guest key and remove the legacy entry so it stops leaking.
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (!legacy) return;
  if (!localStorage.getItem(GUEST_KEY)) {
    localStorage.setItem(GUEST_KEY, legacy);
  }
  localStorage.removeItem(LEGACY_KEY);
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
    wishlistItemId: i.wishlistItemId ?? i.id,
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
  const { user, isAuthenticated } = useAuth();
  // Guests hydrate from localStorage; authenticated users wait for the
  // server probe (or the per-user fallback if the probe fails).
  const [items, setItems] = useState<WishlistItem[]>(() => {
    migrateLegacyGuest();
    return localStorage.getItem("moe_access_token") ? [] : readLocalKey(GUEST_KEY);
  });
  const [isSyncing, setIsSyncing] = useState(false);
  // When true, the backend /wishlist probe failed and we fall back to
  // per-user localStorage as the source of truth.
  const [serverDown, setServerDown] = useState(false);

  useEffect(() => {
    // Persist locally for guests under the guest key.
    if (!isAuthenticated) {
      writeLocalKey(GUEST_KEY, items);
      return;
    }
    // Authed users with a working server don't need a local mirror.
    if (!serverDown || !user?.id) return;
    writeLocalKey(userKey(user.id), items);
  }, [items, isAuthenticated, serverDown, user?.id]);

  // Sync whenever the user identity flips. Logout → clear in-memory; login →
  // merge guest items into the server (or per-user fallback), then probe.
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      // Logout: just clear memory; do NOT touch server data.
      setItems(readLocalKey(GUEST_KEY));
      setServerDown(false);
      return;
    }

    let cancelled = false;
    setIsSyncing(true);
    const guestItems = readLocalKey(GUEST_KEY);

    const finish = () => {
      if (!cancelled) setIsSyncing(false);
    };

    // Probe the server first. 200 → server is source of truth; anything else
    // (404 / 401 unexpected / network) → fall back to per-user localStorage.
    wishlistService
      .list()
      .then(async (res) => {
        if (cancelled) return;
        setServerDown(false);
        let merged = res?.data ? res.data.map(mapApiItem) : [];

        // Merge any guest items the user collected before logging in.
        if (guestItems.length) {
          const have = new Set(merged.map((m) => m.productId));
          const newOnes = guestItems.filter((g) => !have.has(g.productId));
          await Promise.all(
            newOnes.map((g) =>
              wishlistService.add(g.productId).catch(() => null),
            ),
          );
          merged = [...merged, ...newOnes];
          localStorage.removeItem(GUEST_KEY);
        }
        if (!cancelled) setItems(merged);
      })
      .catch(() => {
        if (cancelled) return;
        // Server probe failed — degrade to per-user localStorage so the
        // wishlist still works and doesn't leak across accounts.
        setServerDown(true);
        const stored = readLocalKey(userKey(user.id));
        const have = new Set(stored.map((m) => m.productId));
        const merged = [...stored, ...guestItems.filter((g) => !have.has(g.productId))];
        setItems(merged);
        if (guestItems.length) localStorage.removeItem(GUEST_KEY);
      })
      .finally(finish);

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  const addItem = useCallback((item: WishlistItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.productId === item.productId)) return prev;
      return [...prev, item];
    });
    if (isAuthenticated && !serverDown) {
      wishlistService.add(item.productId).catch(() => {});
    }
  }, [isAuthenticated, serverDown]);

  const removeItem = useCallback((productId: number) => {
    let snapshot: WishlistItem | undefined;
    setItems((prev) => {
      snapshot = prev.find((i) => i.productId === productId);
      return prev.filter((item) => item.productId !== productId);
    });
    if (!isAuthenticated || serverDown) return;
    wishlistService.remove(productId).catch(() => {
      const fallbackId = snapshot?.wishlistItemId;
      if (fallbackId) {
        wishlistService.removeByItemId(fallbackId).catch(() => {});
      }
    });
  }, [isAuthenticated, serverDown]);

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
