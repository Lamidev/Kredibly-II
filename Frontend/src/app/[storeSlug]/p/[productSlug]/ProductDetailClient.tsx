"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { trackEvent } from "@/lib/analytics";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { StorefrontFooter } from "@/components/storefront/StorefrontFooter";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { CheckoutDrawer } from "@/components/storefront/CheckoutDrawer";
import { FloatingWhatsApp } from "@/components/storefront/FloatingWhatsApp";
import { ProductCard } from "@/components/storefront/ProductCard";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import {
  StoreData,
  StoreProduct,
  ProductVariant,
} from "@/types/storefront";
import {
  ShoppingBag,
  Check,
  Plus,
  Minus,
  ChevronRight,
} from "lucide-react";

export function ProductDetailClient({
  store,
  product,
}: {
  store: StoreData;
  product: StoreProduct;
}) {
  const { addItem } = useCartStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<
    ProductVariant | undefined
  >(
    product.hasVariants && product.variants?.length > 0
      ? product.variants[0]
      : undefined
  );
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [trackModalOpen, setTrackModalOpen] = useState(false);

  const activePrice = selectedVariant
    ? Number(selectedVariant.price)
    : Number(product.basePrice);

  const maxStock = selectedVariant
    ? selectedVariant.stockQuantity
    : product.stockQuantity;

  const isSoldOut = maxStock <= 0;

  // GA4 e-commerce: view_item
  useEffect(() => {
    const priceNum = Number(product.basePrice || 0);
    trackEvent("view_item", {
      currency: store.currency || "NGN",
      value: priceNum,
      store_slug: store.slug,
      items: [
        {
          item_id: product.id,
          item_name: product.title,
          item_category: product.category || undefined,
          item_brand: product.brand || store.name,
          price: priceNum,
          quantity: 1,
        },
      ],
    });
  }, [product.id, product.title, product.basePrice, product.category, product.brand, store.currency, store.slug, store.name]);

  // Similar products ("You May Also Like") — same category first, then other store products
  const similarProducts = useMemo(() => {
    const all = (store.products || []).filter((p) => p.id !== product.id);
    if (all.length === 0) return [];

    const prodCat = product.category?.trim().toLowerCase();
    const sameCat = prodCat
      ? all.filter((p) => p.category?.trim().toLowerCase() === prodCat)
      : [];
    const others = all.filter((p) => !sameCat.some((s) => s.id === p.id));
    return [...sameCat, ...others].slice(0, 4);
  }, [store.products, product.id, product.category]);

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

  const handleQuickAddSimilar = (p: StoreProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (p.stockQuantity <= 0) return;
    const firstVar =
      p.hasVariants && p.variants?.length > 0 ? p.variants[0] : undefined;
    addItem({
      productId: p.id,
      variantId: firstVar?.id,
      title: p.title,
      variantName: firstVar?.name,
      price: firstVar ? Number(firstVar.price) : Number(p.basePrice),
      image: p.images?.[0],
      maxStock: firstVar ? firstVar.stockQuantity : p.stockQuantity,
    });
  };

  const images = product.images || [];
  const hasMultipleImages = images.length > 1;

  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#20231e] font-sans flex flex-col">
      <StorefrontHeader
        store={store}
        trackModalOpen={trackModalOpen}
        onOpenTrackModal={() => setTrackModalOpen(true)}
        onCloseTrackModal={() => setTrackModalOpen(false)}
      />

      {/* Main Product Container */}
      <main className="flex-1 mx-auto w-[min(1120px,calc(100%-32px))] md:w-[min(1120px,calc(100%-48px))] pt-6 sm:pt-10 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left Column: Full-Bleed Image Gallery (Thumbnails below on mobile, left on desktop) */}
          <div className="flex flex-col-reverse md:flex-row gap-3">
            {hasMultipleImages && (
              <div className="flex flex-row md:flex-col gap-2.5 shrink-0">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`h-16 w-16 md:h-20 md:w-20 rounded-[6px] bg-white overflow-hidden border transition cursor-pointer shrink-0 ${
                      activeImageIndex === idx
                        ? "border-[#2e1065] ring-2 ring-[#2e1065]/15"
                        : "border-[#e6e8e1] opacity-65 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={`${product.title} view ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 aspect-square w-full rounded-[8px] bg-white border border-[#e6e8e1] overflow-hidden relative">
              {images.length > 0 ? (
                <img
                  src={getImageUrl(images[activeImageIndex])}
                  alt={product.title}
                  className={`w-full h-full object-cover ${
                    isSoldOut ? "opacity-65 grayscale-[30%]" : ""
                  }`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#c5c8be]">
                  <ShoppingBag className="w-16 h-16 stroke-[1.5]" />
                </div>
              )}

              {/* Top-Left: Discount Percentage */}
              {product.comparePrice &&
                Number(product.comparePrice) > activePrice &&
                activePrice > 0 && (
                  <span className="absolute top-3 left-3 bg-[#2e1065] text-white text-[11px] font-bold px-2.5 py-1 rounded-[4px] uppercase tracking-wide">
                    -
                    {Math.round(
                      ((Number(product.comparePrice) - activePrice) /
                        Number(product.comparePrice)) *
                        100
                    )}
                    %
                  </span>
                )}

              {/* Top-Right: Stock Count or Out of Stock */}
              <span
                className={`absolute top-3 right-3 text-[11px] font-semibold px-2.5 py-1 rounded-[4px] backdrop-blur-[5px] ${
                  isSoldOut
                    ? "bg-red-600/90 text-white uppercase tracking-wider"
                    : "bg-[#202020df] text-white"
                }`}
              >
                {isSoldOut ? "Out of Stock" : `${maxStock} in stock`}
              </span>
            </div>
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
                    onClick={() =>
                      setQuantity((q) => Math.min(maxStock, q + 1))
                    }
                    disabled={quantity >= maxStock || isSoldOut}
                    className="h-8 w-8 rounded-[4px] bg-[#f3f4ef] hover:bg-[#e6e8e1] text-[#20231e] flex items-center justify-center font-bold disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isSoldOut}
                className="w-full h-[48px] bg-[#2e1065] hover:bg-[#3b0764] disabled:opacity-40 disabled:cursor-not-allowed text-white font-display font-bold rounded-[8px] transition flex items-center justify-center gap-2 text-sm shadow-sm cursor-pointer"
              >
                <span>
                  {isSoldOut ? "Out of Stock" : "Buy Now — Instant Checkout"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isSoldOut}
                className="w-full h-[46px] bg-white hover:bg-[#f3f4ef] border border-[#daddd4] disabled:opacity-40 disabled:cursor-not-allowed text-[#20231e] font-display font-bold rounded-[8px] transition flex items-center justify-center gap-2 text-xs cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#3b0764]" />
                <span>
                  {isSoldOut
                    ? "Unavailable"
                    : addedAnimation
                    ? "Added to Bag ✓"
                    : "Add to Cart"}
                </span>
              </button>
            </div>

            {/* Description & Specifications */}
            {(product.description ||
              (Array.isArray(product.attributes) &&
                product.attributes.length > 0)) && (
              <div className="space-y-4 pt-4 border-t border-[#daddd4]">
                {product.description && (
                  <div className="space-y-2">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#62665d]">
                      Product Description
                    </h3>
                    <p className="text-xs sm:text-sm text-[#20231e] leading-relaxed whitespace-pre-line">
                      {product.description}
                    </p>
                  </div>
                )}

                {Array.isArray(product.attributes) &&
                  product.attributes.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#62665d]">
                        Specifications
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {product.attributes.map((attr, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-[6px] bg-white border border-[#e6e8e1]"
                          >
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#62665d]">
                              {attr.label}
                            </p>
                            <p className="text-xs font-semibold text-[#20231e] mt-0.5">
                              {attr.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>

        {/* You May Also Like (Similar Products) */}
        {similarProducts.length > 0 && (
          <section className="mt-14 pt-10 border-t border-[#daddd4]">
            <div className="flex items-end justify-between mb-6 gap-4">
              <div>
                <p className="text-[10px] tracking-[1.8px] font-semibold uppercase text-[#62665d] mb-1.5">
                  MORE FOR YOU
                </p>
                <h2 className="font-display text-xl sm:text-3xl font-bold text-[#20231e] tracking-tight">
                  You May Also Like
                </h2>
              </div>
              <Link
                href={`/${store.slug}/products`}
                className="text-xs sm:text-sm font-semibold text-[#2e1065] hover:underline inline-flex items-center gap-0.5 shrink-0"
              >
                <span>Explore All</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-[13px] gap-y-[25px] sm:gap-x-[18px] sm:gap-y-[30px] lg:gap-x-[20px]">
              {similarProducts.map((sim) => (
                <ProductCard
                  key={sim.id}
                  product={sim}
                  store={store}
                  onAddToCart={handleQuickAddSimilar}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <StorefrontFooter
        store={store}
        onTrackOrder={() => setTrackModalOpen(true)}
        extraBottomPadding
      />

      {/* Mobile Floating Sticky Add to Cart Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#daddd4] px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-10 w-10 rounded-[6px] bg-[#fafaf8] border border-[#e6e8e1] overflow-hidden shrink-0">
              {images[0] ? (
                <img
                  src={getImageUrl(images[0])}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#c5c8be]">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#20231e] truncate">
                {product.title}
              </p>
              <p className="font-display text-sm font-bold text-[#20231e]">
                {formatCurrency(activePrice)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isSoldOut}
            className="px-5 h-10 rounded-[8px] bg-[#2e1065] hover:bg-[#3b0764] disabled:opacity-40 text-white font-display font-bold text-xs shrink-0 cursor-pointer"
          >
            {isSoldOut
              ? "Sold Out"
              : addedAnimation
              ? "Added ✓"
              : "Add to Cart"}
          </button>
        </div>
      </div>

      <FloatingWhatsApp store={store} />
      <CartDrawer onCheckoutClick={() => setCheckoutOpen(true)} />
      <CheckoutDrawer
        storeSlug={store.slug}
        shippingConfig={store.shippingConfig}
        subscriptionTier={store.subscriptionTier}
        passFeeToCustomer={store.passFeeToCustomer}
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
    </div>
  );
}
