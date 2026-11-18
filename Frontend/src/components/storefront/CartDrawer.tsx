"use client";

import { useCartStore } from "@/store/useCartStore";
import { formatCurrency, getImageUrl } from "@/lib/utils";
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

  const getFullImageUrl = (path?: string) => getImageUrl(path);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Soft Light Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/30 backdrop-blur-[2px] transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen sm:w-[50vw] sm:max-w-lg h-full bg-white border-l border-[#daddd4] text-[#20231e] flex flex-col justify-between shadow-2xl">
          {/* Header */}
          <div className="px-4 py-4 sm:p-5 border-b border-[#e6e8e1] flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <ShoppingBag className="w-5 h-5 text-[#2e1065] shrink-0" />
              <h2 className="font-display text-base font-bold text-[#20231e] truncate">
                Your Shopping Bag ({count})
              </h2>
            </div>
            <button
              type="button"
              onClick={closeCart}
              aria-label="Close shopping bag"
              className="p-2 rounded-full text-[#62665d] hover:text-[#20231e] hover:bg-[#f3f4ef] transition cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-[#fafaf8]">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="h-14 w-14 rounded-2xl bg-[#f3f4ef] border border-[#daddd4] text-[#62665d] flex items-center justify-center mb-3">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-[#20231e]">
                  Your bag is empty
                </p>
                <p className="text-xs text-[#62665d] mt-1 max-w-xs">
                  Discover products from the store and tap &quot;Add to Cart&quot;.
                </p>
              </div>
            ) : (
              items.map((item, idx) => (
                <div
                  key={`${item.productId}-${item.variantId || idx}`}
                  className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl bg-white border border-[#e6e8e1]"
                >
                  {/* Thumbnail */}
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg bg-[#fafaf8] border border-[#e6e8e1] overflow-hidden shrink-0">
                    {item.image ? (
                      <img
                        src={getFullImageUrl(item.image)}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[#c5c8be]">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Info & Controls */}
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-bold text-[#20231e] line-clamp-2 leading-snug">
                          {item.title}
                        </h3>
                        {item.variantName && (
                          <p className="text-[11px] text-[#62665d] truncate mt-0.5">
                            {item.variantName}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId, item.variantId)}
                        aria-label={`Remove ${item.title} from bag`}
                        className="p-1.5 -mr-1 -mt-1 rounded-lg text-[#62665d] hover:text-red-600 hover:bg-red-50 transition cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <p className="text-xs sm:text-sm font-extrabold text-[#2e1065]">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-[10px] text-[#62665d]">
                            {formatCurrency(item.price)} each
                          </p>
                        )}
                      </div>

                      {/* Touch-friendly Quantity Stepper */}
                      <div className="flex items-center gap-1 bg-[#fafaf8] border border-[#daddd4] rounded-lg p-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.variantId,
                              item.quantity - 1
                            )
                          }
                          aria-label={`Decrease quantity of ${item.title}`}
                          className="h-8 w-8 sm:h-7 sm:w-7 rounded-md bg-white hover:bg-[#f3f4ef] active:bg-[#e6e8e1] text-[#20231e] flex items-center justify-center text-sm font-bold transition cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-mono font-bold min-w-[24px] text-center text-[#20231e]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.variantId,
                              item.quantity + 1
                            )
                          }
                          disabled={item.quantity >= item.maxStock}
                          aria-label={`Increase quantity of ${item.title}`}
                          className="h-8 w-8 sm:h-7 sm:w-7 rounded-md bg-white hover:bg-[#f3f4ef] active:bg-[#e6e8e1] disabled:opacity-40 disabled:cursor-not-allowed text-[#20231e] flex items-center justify-center text-sm font-bold transition cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout CTA */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[#e6e8e1] bg-white space-y-4 shrink-0">
              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#62665d] font-medium">Subtotal</span>
                <span className="font-display text-lg font-extrabold text-[#20231e]">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => {
                  closeCart();
                  if (onCheckoutClick) onCheckoutClick();
                }}
                className="w-full py-3.5 bg-[#2e1065] hover:bg-[#3b0764] text-white font-display font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-sm cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
