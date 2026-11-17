"use client";

import { useCartStore } from "@/store/useCartStore";
import { formatCurrency } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api";
import { X, Trash2, ShieldCheck, ShoppingBag, ArrowRight } from "lucide-react";

interface CartDrawerProps {
  onCheckoutClick?: () => void;
}

export function CartDrawer({ onCheckoutClick }: CartDrawerProps) {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    getSubtotal,
    getTotalCount,
  } = useCartStore();

  if (!isOpen) return null;

  const subtotal = getSubtotal();
  const count = getTotalCount();

  const getFullImageUrl = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const base = API_BASE_URL.replace("/api", "");
    return `${base}${path}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-white flex flex-col justify-between shadow-2xl">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand-500" />
              <h2 className="text-base font-bold text-white">
                Your Shopping Bag ({count})
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="h-16 w-16 rounded-2xl bg-slate-800/80 text-slate-500 flex items-center justify-center mb-3">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold text-slate-300">
                  Your bag is empty
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Discover products from the store and tap &quot;Add to Cart&quot;.
                </p>
              </div>
            ) : (
              items.map((item, idx) => (
                <div
                  key={`${item.productId}-${item.variantId || idx}`}
                  className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80"
                >
                  {/* Thumbnail */}
                  <div className="h-16 w-16 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
                    {item.image ? (
                      <img
                        src={getFullImageUrl(item.image)}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-700">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-white truncate">
                      {item.title}
                    </h3>
                    {item.variantName && (
                      <p className="text-[11px] text-slate-400">
                        {item.variantName}
                      </p>
                    )}
                    <p className="text-xs font-extrabold text-brand-400 mt-0.5">
                      {formatCurrency(item.price)}
                    </p>
                  </div>

                  {/* Quantity Stepper & Remove */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="text-slate-500 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.variantId,
                            item.quantity - 1
                          )
                        }
                        className="h-5 w-5 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs font-bold"
                      >
                        -
                      </button>
                      <span className="text-xs font-mono font-bold px-1 text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.variantId,
                            item.quantity + 1
                          )
                        }
                        className="h-5 w-5 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout CTA */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-800 bg-slate-950/80 space-y-4">
              {/* Escrow Shield Reminder */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs">
                <ShieldCheck className="w-4 h-4 shrink-0 text-brand-500" />
                <span>Protected by Kredibly Escrow. Funds held until delivery.</span>
              </div>

              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Subtotal</span>
                <span className="text-lg font-extrabold text-white">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => {
                  closeCart();
                  if (onCheckoutClick) onCheckoutClick();
                }}
                className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-brand-500/25"
              >
                <span>Proceed to 1-Step Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
