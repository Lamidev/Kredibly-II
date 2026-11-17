"use client";

import { useCartStore } from "@/store/useCartStore";
import { formatCurrency } from "@/lib/utils";
import { ShoppingBag, ArrowRight } from "lucide-react";

export function FloatingCartBar() {
  const { getTotalCount, getSubtotal, openCart } = useCartStore();
  const count = getTotalCount();
  const subtotal = getSubtotal();

  if (count === 0) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 z-40 max-w-md mx-auto sm:max-w-none">
      <button
        onClick={openCart}
        className="w-full sm:w-auto bg-[#2e1065] hover:bg-[#3b0764] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center justify-between sm:gap-6 font-bold transition transform active:scale-95 cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-white/15 flex items-center justify-center text-white">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div className="text-left leading-tight">
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-white/75">
              {count} {count === 1 ? "Item" : "Items"}
            </p>
            <p className="text-sm font-extrabold">
              {formatCurrency(subtotal)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-extrabold bg-white/15 px-3 py-1.5 rounded-lg">
          <span>View Bag</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </button>
    </div>
  );
}
