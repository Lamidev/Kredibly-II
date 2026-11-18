"use client";

import { useEffect } from "react";
import Link from "next/link";
import { getImageUrl } from "@/lib/utils";
import { useWishlistStore } from "@/store/useWishlistStore";
import { ShoppingCart, ShoppingBag, Heart } from "lucide-react";

export interface ProductCardProps {
  product: {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    category?: string | null;
    brand?: string | null;
    isFeatured?: boolean;
    basePrice: number | string;
    comparePrice?: number | string | null;
    images: string[];
    stockQuantity: number;
    hasVariants?: boolean;
    variants?: Array<{
      id: string;
      name: string;
      price: number | string;
      stockQuantity: number;
    }>;
  };
  store: {
    name: string;
    slug: string;
    whatsappNumber: string;
  };
  onAddToCart?: (product: any, e: React.MouseEvent) => void;
  featuredBadge?: string;
}

export function ProductCard({
  product,
  store,
  onAddToCart,
  featuredBadge,
}: ProductCardProps) {
  const { items: wishlistItems, storeSlug: loadedSlug, loadWishlist, toggleWishlist } =
    useWishlistStore();
  useEffect(() => {
    if (loadedSlug !== store.slug) loadWishlist(store.slug);
  }, [store.slug, loadedSlug, loadWishlist]);

  const isWishlisted = wishlistItems.some((p) => p.id === product.id);
  const isSoldOut = product.stockQuantity <= 0;

  const getFullImageUrl = (path?: string) => getImageUrl(path);

  const primaryImage = product.images?.[0];

  const basePriceNum = Number(product.basePrice || 0);
  const comparePriceNum = Number(product.comparePrice || 0);
  const hasDiscount = comparePriceNum > basePriceNum && basePriceNum > 0;
  const discountPct = hasDiscount
    ? Math.round(((comparePriceNum - basePriceNum) / comparePriceNum) * 100)
    : 0;

  const categoryLabel =
    product.category || product.brand || store.name || "Verified Item";

  const badgeText =
    featuredBadge ||
    (isSoldOut
      ? "OUT OF STOCK"
      : hasDiscount
      ? `SAVE ${discountPct}%`
      : product.hasVariants
      ? "MULTIPLE OPTIONS"
      : "");

  return (
    <article className="swot-product-card w-full group font-sans cursor-pointer">
      {/* Full-Bleed Product Image Container */}
      <Link
        href={`/${store.slug}/p/${product.slug}`}
        className="block h-[205px] sm:h-[225px] bg-white border border-[#e6e8e1] rounded-[5px] overflow-hidden relative group-hover:border-[#cfd2c6] transition-colors"
      >
        {primaryImage ? (
          <img
            src={getFullImageUrl(primaryImage)}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#c5c8be]">
            <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
          </div>
        )}

        {/* Quick Wishlist Heart in top-left */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(store.slug, product as any);
          }}
          aria-label="Save to wishlist"
          className={`absolute top-2.5 left-2.5 w-8 h-8 rounded-[6px] backdrop-blur-[5px] flex items-center justify-center transition-all duration-200 cursor-pointer z-10 ${
            isWishlisted
              ? "bg-[#2e1065] text-white"
              : "bg-white/85 text-[#20231e] hover:text-[#2e1065] md:opacity-0 md:group-hover:opacity-100"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${isWishlisted ? "fill-current" : ""}`} />
        </button>

        {/* Quick Add-to-Cart button in top-right */}
        {!isSoldOut && onAddToCart && (
          <button
            type="button"
            onClick={(e) => onAddToCart(product, e)}
            aria-label="Add to cart"
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-[6px] bg-[#202020df] backdrop-blur-[5px] text-white flex items-center justify-center transition-all duration-200 hover:bg-[#2e1065] md:opacity-0 md:group-hover:opacity-100 cursor-pointer z-10"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
          </button>
        )}

        {badgeText && (
          <span className="absolute bottom-[10px] left-[11px] max-w-[calc(100%-22px)] truncate bg-[#202020df] backdrop-blur-[5px] text-white px-[8px] py-[3px] text-[7px] sm:text-[8px] tracking-[0.4px] sm:tracking-[1px] uppercase rounded-[2px] font-medium">
            {badgeText}
          </span>
        )}
      </Link>

      {/* SWOT Category Eyebrow */}
      <p className="text-[#62665d] text-[9px] tracking-[1.3px] uppercase mt-[16px] mb-0 font-medium truncate">
        {categoryLabel}
      </p>

      {/* SWOT Product Title */}
      <Link href={`/${store.slug}/p/${product.slug}`}>
        <h3 className="font-display text-[13px] sm:text-[15px] font-semibold text-[#20231e] mt-[4px] mb-0 tracking-[-0.3px] line-clamp-1 group-hover:text-[#2e1065] transition-colors">
          {product.title}
        </h3>
      </Link>

      {/* Price Display */}
      <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
        {hasDiscount ? (
          <>
            <span className="font-display text-[13px] sm:text-[14.5px] font-bold text-[#20231e]">
              ₦{basePriceNum.toLocaleString("en-NG")}
            </span>
            <span className="text-[11px] text-[#62665d] line-through">
              ₦{comparePriceNum.toLocaleString("en-NG")}
            </span>
          </>
        ) : (
          <span className="font-display text-[13px] sm:text-[14.5px] font-bold text-[#20231e]">
            ₦{basePriceNum.toLocaleString("en-NG")}
          </span>
        )}
      </div>
    </article>
  );
}
