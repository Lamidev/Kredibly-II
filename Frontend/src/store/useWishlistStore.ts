import { create } from "zustand";
import { StoreProduct } from "@/types/storefront";

interface WishlistState {
  storeSlug: string | null;
  items: StoreProduct[];
  loadWishlist: (storeSlug: string) => void;
  toggleWishlist: (storeSlug: string, product: StoreProduct) => void;
  isWishlisted: (productId: string) => boolean;
}

const wishlistKey = (slug: string) => `kredibly_wishlist_${slug}`;

export const useWishlistStore = create<WishlistState>((set, get) => ({
  storeSlug: null,
  items: [],

  loadWishlist: (storeSlug) => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(wishlistKey(storeSlug));
    if (raw) {
      try {
        set({ storeSlug, items: JSON.parse(raw) });
        return;
      } catch {
        // ignore
      }
    }
    set({ storeSlug, items: [] });
  },

  toggleWishlist: (storeSlug, product) => {
    set((state) => {
      const exists = state.items.some((p) => p.id === product.id);
      const next = exists
        ? state.items.filter((p) => p.id !== product.id)
        : [product, ...state.items];
      if (typeof window !== "undefined") {
        localStorage.setItem(wishlistKey(storeSlug), JSON.stringify(next));
      }
      return { storeSlug, items: next };
    });
  },

  isWishlisted: (productId) => {
    return get().items.some((p) => p.id === productId);
  },
}));
