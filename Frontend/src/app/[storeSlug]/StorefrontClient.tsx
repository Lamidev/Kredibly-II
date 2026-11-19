"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { StorefrontFooter } from "@/components/storefront/StorefrontFooter";
import { FilterDrawer, FilterState } from "@/components/storefront/FilterDrawer";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { FloatingCartBar } from "@/components/storefront/FloatingCartBar";
import { FloatingWhatsApp } from "@/components/storefront/FloatingWhatsApp";
import { CheckoutDrawer } from "@/components/storefront/CheckoutDrawer";
import { ProductCard } from "@/components/storefront/ProductCard";
import { getImageUrl } from "@/lib/utils";
import {
  StoreData,
  StoreProduct,
  extractStoreCategories,
  getFreeDeliveryBannerText,
  getStorefrontBannerText,
} from "@/types/storefront";
import {
  Package,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";

const HOME_COLLECTION_LIMIT = 8;

export function StorefrontClient({ store }: { store: StoreData }) {
  const { addItem } = useCartStore();
  const products = store.products || [];

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "newest" | "price-asc" | "price-desc" | "sale"
  >("newest");

  const [filters, setFilters] = useState<FilterState>({
    minPrice: "",
    maxPrice: "",
    inStockOnly: false,
    onSaleOnly: false,
    category: "all",
    attributes: {},
  });

  const categories = useMemo(
    () => extractStoreCategories(products),
    [products]
  );

  const resetFilters = () => {
    setFilters({
      minPrice: "",
      maxPrice: "",
      inStockOnly: false,
      onSaleOnly: false,
      category: "all",
      attributes: {},
    });
    setSearchQuery("");
  };

  const handleQuickAdd = (product: StoreProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stockQuantity <= 0) return;

    const firstVariant =
      product.hasVariants && product.variants?.length > 0
        ? product.variants[0]
        : undefined;
    const price = firstVariant
      ? Number(firstVariant.price)
      : Number(product.basePrice);

    addItem({
      productId: product.id,
      variantId: firstVariant?.id,
      title: product.title,
      variantName: firstVariant?.name,
      price,
      image: product.images?.[0],
      maxStock: firstVariant
        ? firstVariant.stockQuantity
        : product.stockQuantity,
    });
  };

  const topArrivals = useMemo(() => {
    const featured = products.filter((p) => p.isFeatured);
    if (featured.length >= 4) return featured.slice(0, 4);
    return products.slice(0, 4);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (filters.category !== "all") {
      list = list.filter(
        (p) =>
          p.category && p.category.trim().toLowerCase() === filters.category
      );
    }

    if (filters.inStockOnly) {
      list = list.filter((p) => p.stockQuantity > 0);
    }

    if (filters.onSaleOnly) {
      list = list.filter(
        (p) => p.comparePrice && Number(p.comparePrice) > Number(p.basePrice)
      );
    }

    if (filters.minPrice !== "") {
      const min = Number(filters.minPrice);
      if (!Number.isNaN(min)) {
        list = list.filter((p) => Number(p.basePrice) >= min);
      }
    }

    if (filters.maxPrice !== "") {
      const max = Number(filters.maxPrice);
      if (!Number.isNaN(max)) {
        list = list.filter((p) => Number(p.basePrice) <= max);
      }
    }

    const attrEntries = Object.entries(filters.attributes);
    if (attrEntries.length > 0) {
      list = list.filter((p) =>
        attrEntries.every(([label, allowedValues]) => {
          if (allowedValues.length === 0) return true;
          if (Array.isArray(p.attributes) && p.attributes.length > 0) {
            return p.attributes.some(
              (a) =>
                a.label?.trim() === label &&
                allowedValues.includes(a.value?.trim())
            );
          }
          if (label === "Brand" && p.brand) {
            return allowedValues.includes(p.brand.trim());
          }
          return false;
        })
      );
    }

    if (sortBy === "price-asc") {
      list.sort((a, b) => Number(a.basePrice) - Number(b.basePrice));
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => Number(b.basePrice) - Number(a.basePrice));
    } else if (sortBy === "sale") {
      list.sort((a, b) => {
        const discA = a.comparePrice
          ? Number(a.comparePrice) - Number(a.basePrice)
          : 0;
        const discB = b.comparePrice
          ? Number(b.comparePrice) - Number(b.basePrice)
          : 0;
        return discB - discA;
      });
    }

    return list;
  }, [products, searchQuery, filters, sortBy]);

  const activeFilterCount =
    (filters.minPrice ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0) +
    (filters.onSaleOnly ? 1 : 0) +
    (filters.category !== "all" ? 1 : 0) +
    Object.values(filters.attributes).reduce((acc, v) => acc + v.length, 0);

  const visibleProducts = filteredProducts.slice(0, HOME_COLLECTION_LIMIT);
  const freeDeliveryBanner = getFreeDeliveryBannerText(store.shippingConfig);
  const topOfferBanner = getStorefrontBannerText(store.shippingConfig);

  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#20231e] font-sans flex flex-col">
      <StorefrontHeader
        store={store}
        topBanner={topOfferBanner}
        selectedCategory={filters.category}
        onSelectCategory={(catKey) =>
          setFilters((prev) => ({ ...prev, category: catKey }))
        }
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        trackModalOpen={trackModalOpen}
        onOpenTrackModal={() => setTrackModalOpen(true)}
        onCloseTrackModal={() => setTrackModalOpen(false)}
      />

      {/* Store Hero Section */}
      {store.bannerUrl ? (
        <section className="relative w-full border-b border-[#daddd4] overflow-hidden bg-slate-950">
          <img
            src={getImageUrl(store.bannerUrl)}
            alt={store.name}
            className="absolute inset-0 w-full h-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/55 to-slate-950/35" />
          <div className="relative mx-auto w-[min(1180px,calc(100%-32px))] md:w-[min(1180px,calc(100%-48px))] py-12 sm:py-20 text-center max-w-2xl space-y-4">
            <h1 className="font-display text-[clamp(28px,4.2vw,46px)] leading-[1.12] tracking-[-1.2px] font-bold text-white m-0">
              {store.name}
            </h1>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-xl mx-auto">
              {store.description ||
                `Browse and shop directly from ${store.name}.`}
            </p>
            <div className="pt-2 flex items-center justify-center">
              <Link
                href={`/${store.slug}/products`}
                className="px-5 py-2.5 rounded-[6px] bg-white hover:bg-slate-100 text-[#0f172a] font-display font-bold text-xs sm:text-sm inline-flex items-center transition"
              >
                Browse Products
              </Link>
            </div>
            <p className="text-[11px] text-slate-300 flex items-center justify-center gap-2 pt-1">
              <span>
                {freeDeliveryBanner ? "Free Delivery Available" : "Fast Delivery"}
              </span>
              <span>•</span>
              <span>Instant Checkout</span>
              <span>•</span>
              <span>Direct Order Tracking</span>
            </p>
          </div>
        </section>
      ) : (
        <section className="relative w-full bg-gradient-to-b from-[#f5f2fa] via-[#fafaf8] to-[#fafaf8] border-b border-[#daddd4] overflow-hidden">
          {/* Storefront Architectural Grid Pattern */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(46, 16, 101, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(46, 16, 101, 0.05) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              maskImage:
                "radial-gradient(ellipse 75% 80% at 50% 45%, black 35%, transparent 100%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 75% 80% at 50% 45%, black 35%, transparent 100%)",
            }}
          />

          {/* Subtle Concentric Storefront Halo */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[540px] h-[280px] rounded-full bg-[#2e1065]/[0.06] blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] rounded-full border border-[#2e1065]/[0.06] pointer-events-none" />
          <div className="hidden sm:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] rounded-full border border-[#2e1065]/[0.04] pointer-events-none" />

          <div className="relative z-10 mx-auto w-[min(1180px,calc(100%-32px))] md:w-[min(1180px,calc(100%-48px))] py-12 sm:py-16 text-center max-w-2xl space-y-3.5">
            <h1 className="font-display text-[clamp(28px,4vw,42px)] leading-[1.15] tracking-[-1.2px] font-bold text-[#20231e] m-0">
              {store.name}
            </h1>
            <p className="text-sm sm:text-base text-[#62665d] leading-relaxed max-w-xl mx-auto">
              {store.description ||
                `Shop directly from ${store.name}. Fast delivery & instant checkout.`}
            </p>
            <div className="pt-1.5 flex items-center justify-center">
              <Link
                href={`/${store.slug}/products`}
                className="px-5 py-2.5 rounded-[6px] bg-[#2e1065] hover:bg-[#3b0764] text-white font-display font-bold text-xs sm:text-sm inline-flex items-center transition"
              >
                Browse Products
              </Link>
            </div>
            <p className="text-[11px] text-[#62665d] flex items-center justify-center gap-2 pt-1">
              <span>
                {freeDeliveryBanner ? "Free Delivery Available" : "Fast Delivery"}
              </span>
              <span>•</span>
              <span>Instant Checkout</span>
              <span>•</span>
              <span>Direct Order Tracking</span>
            </p>
          </div>
        </section>
      )}

      {/* Curated Arrivals (Only shown when not searching/filtering and store has >4 products) */}
      {!searchQuery &&
        filters.category === "all" &&
        activeFilterCount === 0 &&
        products.length > 4 && (
          <section className="py-14 sm:py-20 bg-[#fafaf8]">
            <div className="mx-auto w-[min(1180px,calc(100%-32px))] md:w-[min(1180px,calc(100%-48px))]">
              <div className="flex flex-row items-end justify-between mb-7 sm:mb-10 gap-4">
                <div>
                  <p className="text-[8px] sm:text-[10px] tracking-[1.8px] sm:tracking-[2.2px] font-semibold uppercase text-[#62665d] mb-2.5 sm:mb-3">
                    CURATED ARRIVALS
                  </p>
                  <h2 className="font-display text-[clamp(24px,3.5vw,42px)] leading-[1.18] font-semibold text-[#20231e] tracking-[-1.2px] m-0">
                    Top Products
                  </h2>
                </div>
                <Link
                  href={`/${store.slug}/products`}
                  className="text-[12px] sm:text-[13px] text-[#20231e] font-semibold hover:bg-[#e6e8e1]/60 rounded-[6px] px-3 py-2 flex items-center gap-1 transition-all shrink-0"
                >
                  <span>View All</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-[13px] gap-y-[25px] sm:gap-x-[18px] sm:gap-y-[30px] lg:gap-x-[20px] lg:gap-y-[32px]">
                {topArrivals.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    store={store}
                    onAddToCart={handleQuickAdd}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

      {/* Main Collection Section */}
      <section
        id="catalogue"
        className="flex-1 py-12 sm:py-16 bg-[#f3f4ef] border-t border-[#daddd4]"
      >
        <div className="mx-auto w-[min(1180px,calc(100%-32px))] md:w-[min(1180px,calc(100%-48px))]">
          {/* Section Header + Filter, Sort & View All */}
          <div className="flex items-end justify-between mb-5 sm:mb-6 gap-3">
            <div className="min-w-0">
              <p className="text-[8px] sm:text-[10px] tracking-[1.8px] sm:tracking-[2.2px] font-semibold uppercase text-[#62665d] mb-2 sm:mb-2.5">
                HANDPICKED COLLECTION
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-display text-[clamp(22px,3.5vw,40px)] leading-[1.18] font-semibold text-[#20231e] tracking-[-1px] m-0 truncate">
                  {filters.category === "all"
                    ? "Featured Picks"
                    : categories.find((c) => c.key === filters.category)
                        ?.label || "Collection"}
                </h2>
                <Link
                  href={`/${store.slug}/products`}
                  className="text-xs sm:text-[13px] font-semibold text-[#2e1065] hover:underline inline-flex items-center gap-0.5 shrink-0"
                >
                  <span>View All</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Filter + Sort Controls (Always right-aligned) */}
            <div className="flex items-center gap-2 shrink-0">
              {products.some(
                (p) => p.comparePrice && Number(p.comparePrice) > Number(p.basePrice)
              ) && (
                <button
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      onSaleOnly: !prev.onSaleOnly,
                    }))
                  }
                  className={`hidden sm:inline-flex h-9 px-3 rounded-[6px] border text-[12.5px] font-semibold items-center transition-colors cursor-pointer ${
                    filters.onSaleOnly
                      ? "bg-[#2e1065] border-[#2e1065] text-white"
                      : "bg-white border-[#daddd4] text-[#20231e] hover:border-[#2e1065]"
                  }`}
                >
                  On Sale
                </button>
              )}
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(true)}
                className={`h-9 px-3 rounded-[6px] border text-[12.5px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeFilterCount > 0
                    ? "bg-[#2e1065] border-[#2e1065] text-white"
                    : "bg-white border-[#daddd4] text-[#20231e] hover:border-[#2e1065]"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>
                  Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                </span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSortMenuOpen((prev) => !prev)}
                  className="h-9 px-3 rounded-[6px] bg-white border border-[#daddd4] hover:border-[#2e1065] text-[12.5px] font-semibold text-[#20231e] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Sort</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#62665d]" />
                </button>

                {sortMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-48 rounded-[8px] bg-white border border-[#daddd4] shadow-lg py-1 z-20">
                    {(
                      [
                        { value: "newest", label: "Newest Arrivals" },
                        { value: "price-asc", label: "Price: Low to High" },
                        { value: "price-desc", label: "Price: High to Low" },
                        { value: "sale", label: "On Sale / Discounted" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSortBy(opt.value);
                          setSortMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                          sortBy === opt.value
                            ? "bg-[#2e1065]/10 text-[#2e1065] font-semibold"
                            : "text-[#20231e] hover:bg-[#f3f4ef]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Category Filter Pills */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1 mb-7 sm:mb-9 font-display">
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, category: "all" }))
                }
                className={`px-3.5 sm:px-4 py-2 rounded-[6px] text-[13px] sm:text-[14.5px] font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  filters.category === "all"
                    ? "border border-[#2e1065] bg-[#2e1065]/[0.06] text-[#2e1065] shadow-2xs"
                    : "text-[#62665d] hover:text-[#20231e] hover:bg-black/[0.03]"
                }`}
              >
                All items ({products.length})
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, category: cat.key }))
                  }
                  className={`px-3.5 sm:px-4 py-2 rounded-[6px] text-[13px] sm:text-[14.5px] font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    filters.category === cat.key
                      ? "border border-[#2e1065] bg-[#2e1065]/[0.06] text-[#2e1065] shadow-2xs"
                      : "text-[#62665d] hover:text-[#20231e] hover:bg-black/[0.03]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* Product Grid (Capped at 8 on Homepage) */}
          {visibleProducts.length === 0 ? (
            <div className="py-16 text-center bg-white border border-[#daddd4] rounded-[8px]">
              <Package className="w-10 h-10 text-[#9aa092] mx-auto mb-3" />
              <p className="font-display text-base font-semibold text-[#20231e]">
                No products match your search
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-3 text-xs font-semibold text-[#2e1065] hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-[13px] gap-y-[25px] sm:gap-x-[18px] sm:gap-y-[30px] lg:gap-x-[20px] lg:gap-y-[32px]">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  store={store}
                  onAddToCart={handleQuickAdd}
                />
              ))}
            </div>
          )}

          {filteredProducts.length > HOME_COLLECTION_LIMIT && (
            <div className="mt-10 flex justify-center">
              <Link
                href={`/${store.slug}/products`}
                className="px-6 py-2.5 rounded-[6px] bg-white hover:bg-[#e6e8e1] border border-[#daddd4] font-display text-xs sm:text-sm font-semibold text-[#20231e] inline-flex items-center gap-1 transition"
              >
                <span>View All {filteredProducts.length} Products</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      <StorefrontFooter
        store={store}
        onTrackOrder={() => setTrackModalOpen(true)}
      />

      <FilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        products={products}
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
      />

      <FloatingWhatsApp store={store} />
      <FloatingCartBar />
      <CartDrawer onCheckoutClick={() => setCheckoutOpen(true)} />
      <CheckoutDrawer
        storeSlug={store.slug}
        shippingConfig={store.shippingConfig}
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
    </div>
  );
}
