import { create } from "zustand";

export interface CartItem {
  productId: string;
  variantId?: string;
  title: string;
  variantName?: string;
  price: number;
  image?: string;
  quantity: number;
  maxStock: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId: string | undefined, qty: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  getTotalCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isOpen: false,

  addItem: (newItem, qty = 1) => {
    set((state) => {
      const existingIndex = state.items.findIndex(
        (i) => i.productId === newItem.productId && i.variantId === newItem.variantId
      );

      let updatedItems = [...state.items];
      if (existingIndex > -1) {
        const existing = updatedItems[existingIndex];
        const newQty = Math.min(existing.quantity + qty, newItem.maxStock);
        updatedItems[existingIndex] = { ...existing, quantity: newQty };
      } else {
        const initialQty = Math.min(qty, newItem.maxStock);
        updatedItems.push({ ...newItem, quantity: initialQty });
      }

      return { items: updatedItems, isOpen: true };
    });
  },

  removeItem: (productId, variantId) => {
    set((state) => ({
      items: state.items.filter(
        (i) => !(i.productId === productId && i.variantId === variantId)
      ),
    }));
  },

  updateQuantity: (productId, variantId, qty) => {
    set((state) => {
      if (qty <= 0) {
        return {
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          ),
        };
      }

      return {
        items: state.items.map((i) => {
          if (i.productId === productId && i.variantId === variantId) {
            return { ...i, quantity: Math.min(qty, i.maxStock) };
          }
          return i;
        }),
      };
    });
  },

  clearCart: () => set({ items: [] }),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

  getTotalCount: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getSubtotal: () => {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
  },
}));
