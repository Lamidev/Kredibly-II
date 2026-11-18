import { create } from "zustand";

export interface ShopperProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  createdAt?: string;
}

interface ShopperState {
  storeSlug: string | null;
  token: string | null;
  customer: ShopperProfile | null;
  loadShopper: (storeSlug: string) => void;
  setShopperAuth: (
    storeSlug: string,
    token: string,
    customer: ShopperProfile
  ) => void;
  updateShopperProfile: (
    storeSlug: string,
    partial: Partial<ShopperProfile>
  ) => void;
  logoutShopper: (storeSlug: string) => void;
}

const tokenKey = (slug: string) => `kredibly_shopper_token_${slug}`;
const profileKey = (slug: string) => `kredibly_shopper_profile_${slug}`;

export const useShopperStore = create<ShopperState>((set) => ({
  storeSlug: null,
  token: null,
  customer: null,

  loadShopper: (storeSlug) => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem(tokenKey(storeSlug));
    const raw = localStorage.getItem(profileKey(storeSlug));
    if (token && raw) {
      try {
        set({ storeSlug, token, customer: JSON.parse(raw) });
        return;
      } catch {
        // ignore invalid json
      }
    }
    set({ storeSlug, token: null, customer: null });
  },

  setShopperAuth: (storeSlug, token, customer) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(tokenKey(storeSlug), token);
      localStorage.setItem(profileKey(storeSlug), JSON.stringify(customer));
    }
    set({ storeSlug, token, customer });
  },

  updateShopperProfile: (storeSlug, partial) => {
    set((state) => {
      if (!state.customer) return state;
      const next = { ...state.customer, ...partial };
      if (typeof window !== "undefined") {
        localStorage.setItem(profileKey(storeSlug), JSON.stringify(next));
      }
      return { customer: next };
    });
  },

  logoutShopper: (storeSlug) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(tokenKey(storeSlug));
      localStorage.removeItem(profileKey(storeSlug));
    }
    set({ storeSlug, token: null, customer: null });
  },
}));
