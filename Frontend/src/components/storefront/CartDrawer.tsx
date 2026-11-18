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
        <div className="w-screen sm:w-[50vw] sm:max-w-lg bg-white border-l border-[#daddd4] text-[#20231e] flex flex-col justify-between shadow-2xl">
          {/* Header */}
          <div className="p-5 border-b border-[#e6e8e1] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#2e1065]" />
              <h2 className="font-display text-base font-bold text-[#20231e]">
                Your Shopping Bag ({count})
              </h2>
            </div>
            <button
              onClick={closeCart}
              aria-label="Close shopping bag"
              className="p-1.5 rounded-full text-[#62665d] hover:text-[#20231e] hover:bg-[#f3f4ef] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-[#fafaf8]">
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
                  className="flex items-center gap-3.5 p-3 rounded-xl bg-white border border-[#e6e8e1]"
                >
                  {/* Thumbnail */}
                  <div className="h-16 w-16 rounded-lg bg-[#fafaf8] border border-[#e6e8e1] overflow-hidden shrink-0">
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

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-[#20231e] truncate">
                      {item.title}
                    </h3>
                    {item.variantName && (
                      <p className="text-[11px] text-[#62665d]">
                        {item.variantName}
                      </p>
                    )}
                    <p className="text-xs font-extrabold text-[#2e1065] mt-0.5">
                      {formatCurrency(item.price)}
                    </p>
                  </div>

                  {/* Quantity Stepper & Remove */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="text-[#62665d] hover:text-red-600 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-1.5 bg-[#fafaf8] border border-[#daddd4] rounded-lg p-0.5">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.variantId,
                            item.quantity - 1
                          )
                        }
                        className="h-5 w-5 rounded bg-white hover:bg-[#f3f4ef] text-[#20231e] flex items-center justify-center text-xs font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xs font-mono font-bold px-1 text-[#20231e]">
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
                        className="h-5 w-5 rounded bg-white hover:bg-[#f3f4ef] text-[#20231e] flex items-center justify-center text-xs font-bold cursor-pointer"
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
            <div className="p-5 border-t border-[#e6e8e1] bg-white space-y-4">
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
