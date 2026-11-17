"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { FloatingCartBar } from "@/components/storefront/FloatingCartBar";
import { CheckoutDrawer } from "@/components/storefront/CheckoutDrawer";
import { formatCurrency } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api";
import {
  ArrowLeft,
  ShieldCheck,
  ShoppingBag,
  Check,
  Plus,
  Minus,
} from "lucide-react";

interface Variant {
  id: string;
  name: string;
  price: number | string;
  stockQuantity: number;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  description?: string;
  category?: string | null;
  brand?: string | null;
  basePrice: number | string;
  comparePrice?: number | string | null;
  images: string[];
  stockQuantity: number;
  hasVariants: boolean;
  variants: Variant[];
}

interface StoreData {
  id: string;
  name: string;
  slug: string;
  whatsappNumber: string;
  currency: string;
}

export function ProductDetailClient({
  store,
  product,
}: {
  store: StoreData;
  product: Product;
}) {
  const { addItem, openCart, getTotalCount } = useCartStore();
  const cartCount = getTotalCount();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<Variant | undefined>(
    product.hasVariants && product.variants?.length > 0
      ? product.variants[0]
      : undefined
  );
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const getFullImageUrl = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const base = API_BASE_URL.replace("/api", "");
    return `${base}${path}`;
  };

  const activePrice = selectedVariant
    ? Number(selectedVariant.price)
    : Number(product.basePrice);

  const maxStock = selectedVariant
    ? selectedVariant.stockQuantity
    : product.stockQuantity;

  const isSoldOut = maxStock <= 0;

  const handleAddToCart = () => {
    if (isSoldOut) return;

    addItem(
      {
        productId: product.id,
        variantId: selectedVariant?.id,
        title: product.title,
        variantName: selectedVariant?.name,
        price: activePrice,
        image: product.images?.[0],
        maxStock,
      },
      quantity
    );

    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const handleBuyNow = () => {
    if (isSoldOut) return;
    addItem(
      {
        productId: product.id,
        variantId: selectedVariant?.id,
        title: product.title,
        variantName: selectedVariant?.name,
        price: activePrice,
        image: product.images?.[0],
        maxStock,
      },
      quantity
    );
    setCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#20231e] font-sans pb-24">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-30 bg-[#fafaf8]/95 backdrop-blur-md border-b border-[#daddd4]">
        <div className="mx-auto w-[min(1180px,calc(100%-32px))] md:w-[min(1180px,calc(100%-48px))] py-3.5 flex items-center justify-between">
          <Link
            href={`/${store.slug}`}
            className="px-3 py-2 rounded-[6px] bg-[#f3f4ef] hover:bg-[#e6e8e1] border border-[#daddd4] text-[#20231e] transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {store.name}</span>
          </Link>

          <button
            onClick={openCart}
            className="px-3.5 py-2 rounded-[6px] bg-[#2e1065] hover:bg-[#3b0764] text-white transition relative flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="font-mono font-bold">{cartCount}</span>
          </button>
        </div>
      </nav>

      {/* Main Product Container */}
      <main className="mx-auto w-[min(1080px,calc(100%-32px))] pt-8 sm:pt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left Column: Image Gallery */}
          <div className="space-y-3">
            <div className="aspect-square w-full rounded-[6px] bg-white border border-[#e6e8e1] overflow-hidden relative flex items-center justify-center p-6">
              {product.images && product.images.length > 0 ? (
                <img
                  src={getFullImageUrl(product.images[activeImageIndex])}
                  alt={product.title}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#c5c8be]">
                  <ShoppingBag className="w-16 h-16 stroke-[1.5]" />
                </div>
              )}

              {isSoldOut && (
                <div className="absolute top-3 left-3 bg-[#202020df] text-white text-[10px] font-bold px-2.5 py-1 rounded-[3px] uppercase tracking-wider">
                  Out of Stock
                </div>
              )}
            </div>

            {/* Thumbnail switcher if 2 images */}
            {product.images && product.images.length > 1 && (
              <div className="flex items-center gap-3">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`h-16 w-16 rounded-[5px] bg-white p-1.5 overflow-hidden border transition cursor-pointer ${
                      activeImageIndex === idx
                        ? "border-[#2e1065] ring-2 ring-[#2e1065]/15"
                        : "border-[#e6e8e1] opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={getFullImageUrl(img)}
                      alt="Thumbnail"
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Info & Actions */}
          <div className="space-y-6">
            <div>
              <p className="text-[10px] tracking-[1.6px] uppercase font-bold text-[#62665d] mb-2">
                {product.category || product.brand || store.name}
              </p>

              <h1 className="font-display text-2xl sm:text-4xl font-semibold text-[#20231e] tracking-[-1px] leading-tight">
                {product.title}
              </h1>

              {/* Price Row */}
              <div className="flex items-baseline gap-3 mt-3">
                <span className="font-display text-2xl sm:text-3xl font-bold text-[#20231e]">
                  {formatCurrency(activePrice)}
                </span>
                {product.comparePrice &&
                  Number(product.comparePrice) > activePrice && (
                    <span className="text-base text-[#62665d] line-through">
                      {formatCurrency(product.comparePrice)}
                    </span>
                  )}
              </div>
            </div>

            {/* Variant Selector */}
            {product.hasVariants && product.variants?.length > 0 && (
              <div className="space-y-2.5 pt-4 border-t border-[#daddd4]">
                <label className="block text-[11px] font-bold text-[#62665d] uppercase tracking-wider">
                  Select Option:
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`px-3.5 py-2 rounded-[6px] text-xs font-semibold transition flex items-center gap-1.5 border cursor-pointer ${
                          isSelected
                            ? "bg-[#2e1065] text-white border-[#2e1065]"
                            : "bg-white text-[#20231e] border-[#daddd4] hover:border-[#20231e]"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{v.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Stepper */}
            <div className="space-y-2 pt-4 border-t border-[#daddd4]">
              <label className="block text-[11px] font-bold text-[#62665d] uppercase tracking-wider">
                Quantity:
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white border border-[#daddd4] rounded-[6px] p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isSoldOut}
                    className="h-8 w-8 rounded-[4px] bg-[#f3f4ef] hover:bg-[#e6e8e1] text-[#20231e] flex items-center justify-center font-bold disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-mono font-bold text-sm text-[#20231e]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                    disabled={quantity >= maxStock || isSoldOut}
                    className="h-8 w-8 rounded-[4px] bg-[#f3f4ef] hover:bg-[#e6e8e1] text-[#20231e] flex items-center justify-center font-bold disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="text-xs text-[#62665d] font-medium">
                  {isSoldOut ? "Sold out" : `${maxStock} available in stock`}
                </span>
              </div>
            </div>

            {/* Action Buttons (No WhatsApp bypass — Direct Checkout or Add to Bag) */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isSoldOut}
                className="w-full h-[48px] bg-[#2e1065] hover:bg-[#3b0764] disabled:opacity-40 text-white font-display font-bold rounded-[8px] transition flex items-center justify-center gap-2 text-sm shadow-sm cursor-pointer"
              >
                <span>Buy Now — Instant Escrow Checkout</span>
              </button>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isSoldOut}
                className="w-full h-[46px] bg-white hover:bg-[#f3f4ef] border border-[#daddd4] disabled:opacity-40 text-[#20231e] font-display font-bold rounded-[8px] transition flex items-center justify-center gap-2 text-xs cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#3b0764]" />
                <span>{addedAnimation ? "Added to Bag ✓" : "Add to Bag"}</span>
              </button>
            </div>

            {/* Escrow Guarantee Callout */}
            <div className="p-4 rounded-[6px] bg-[#f3f4ef] border border-[#daddd4] flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#3b0764] shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-[#20231e]">
                  100% Delivery Guarantee · Kredibly Escrow
                </p>
                <p className="text-[#62665d] leading-relaxed">
                  Your payment is held safely in the Kredibly Escrow Vault until your order is delivered. After payment, you receive an instant verified receipt with direct seller WhatsApp access.
                </p>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="space-y-2 pt-4 border-t border-[#daddd4]">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#62665d]">
                  Product Details &amp; Specifications
                </h3>
                <p className="text-xs sm:text-sm text-[#20231e] leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Cart Drawer, Checkout Drawer & Floating Bar */}
      <CartDrawer onCheckoutClick={() => setCheckoutOpen(true)} />
      <CheckoutDrawer
        storeSlug={store.slug}
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
      <FloatingCartBar />
    </div>
  );
}
