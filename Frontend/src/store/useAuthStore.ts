import { create } from "zustand";

export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  whatsappNumber: string;
  currency: string;
  subscriptionTier: string;
  logoUrl?: string | null;
  bankCode?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  wallet?: {
    availableBalance: number | string;
    escrowBalance: number | string;
  } | null;
}

interface AuthState {
  token: string | null;
  user: User | null;
  store: Store | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User, store?: Store | null) => void;
  updateUser: (user: Partial<User>) => void;
  updateStore: (store: Partial<Store>) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  store: null,
  isAuthenticated: false,

  setAuth: (token, user, store) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kredibly_auth_token", token);
      localStorage.setItem("kredibly_user", JSON.stringify(user));
      if (store) {
        localStorage.setItem("kredibly_store", JSON.stringify(store));
      } else {
        localStorage.removeItem("kredibly_store");
      }
    }
    set({ token, user, store: store || null, isAuthenticated: true });
  },

  updateUser: (updatedFields) => {
    set((state) => {
      if (!state.user) return state;
      const newUser = { ...state.user, ...updatedFields };
      if (typeof window !== "undefined") {
        localStorage.setItem("kredibly_user", JSON.stringify(newUser));
      }
      return { user: newUser };
    });
  },

  updateStore: (updatedFields) => {
    set((state) => {
      if (!state.store) return state;
      const newStore = { ...state.store, ...updatedFields };
      if (typeof window !== "undefined") {
        localStorage.setItem("kredibly_store", JSON.stringify(newStore));
      }
      return { store: newStore };
    });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("kredibly_auth_token");
      localStorage.removeItem("kredibly_user");
      localStorage.removeItem("kredibly_store");
    }
    set({ token: null, user: null, store: null, isAuthenticated: false });
  },

  initialize: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("kredibly_auth_token");
      const userStr = localStorage.getItem("kredibly_user");
      const storeStr = localStorage.getItem("kredibly_store");

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          const store =
            storeStr && storeStr !== "undefined" && storeStr !== "null"
              ? JSON.parse(storeStr)
              : null;
          set({ token, user, store, isAuthenticated: true });
        } catch {
          localStorage.removeItem("kredibly_auth_token");
        }
      }
    }
  },
}));
