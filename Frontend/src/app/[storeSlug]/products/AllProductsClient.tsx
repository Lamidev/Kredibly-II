"use client";

import { useState, useMemo } from "react";
import { useCartStore } from "@/store/useCartStore";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { StorefrontFooter } from "@/components/storefront/StorefrontFooter";
import { FilterDrawer, FilterState } from "@/components/storefront/FilterDrawer";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { CheckoutDrawer } from "@/components/storefront/CheckoutDrawer";
import { FloatingCartBar } from "@/components/storefront/FloatingCartBar";
import { FloatingWhatsApp } from "@/components/storefront/FloatingWhatsApp";
import { ProductCard } from "@/components/storefront/ProductCard";
import {
  StoreData,
  StoreProduct,
  extractStoreCategories,
  normalizeCategoryKey,
} from "@/types/storefront";
import { SlidersHorizontal, ChevronDown, Package, X } from "lucide-react";

const ITEMS_PER_PAGE = 24;

export function AllProductsClient({
  store,
  initialCategory = "all",
  initialQuery = "",
}: {
  store: StoreData;
  initialCategory?: string;
  initialQuery?: string;
}) {
  const { addItem } = useCartStore();
  const products = store.products || [];

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState<
    "newest" | "price-asc" | "price-desc" | "sale"
  >("newest");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const [filters, setFilters] = useState<FilterState>({
    minPrice: "",
    maxPrice: "",
    inStockOnly: false,
    onSaleOnly: false,
    category: initialCategory || "all",
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
    setVisibleCount(ITEMS_PER_PAGE);
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
          p.category && normalizeCategoryKey(p.category) === filters.category
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

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = filteredProducts.length > visibleCount;

  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#20231e] font-sans flex flex-col">
      <StorefrontHeader
        store={store}
        selectedCategory={filters.category}
        onSelectCategory={(catKey) => {
          setFilters((prev) => ({ ...prev, category: catKey }));
          setVisibleCount(ITEMS_PER_PAGE);
        }}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setVisibleCount(ITEMS_PER_PAGE);
        }}
        trackModalOpen={trackModalOpen}
        onOpenTrackModal={() => setTrackModalOpen(true)}
        onCloseTrackModal={() => setTrackModalOpen(false)}
      />

      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto w-[min(1180px,calc(100%-32px))] md:w-[min(1180px,calc(100%-48px))]">
          {/* Title + Filter & Sort Controls */}
          <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-[#e6e8e1]">
            <div className="flex items-baseline gap-2.5 min-w-0">
              <h1 className="font-display text-xl sm:text-3xl font-bold text-[#20231e] tracking-tight truncate">
                All Products
              </h1>
              <span className="text-xs sm:text-sm font-medium text-[#62665d]">
                {filteredProducts.length}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(true)}
                className={`h-9 px-3 rounded-[6px] border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
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
                  className="h-9 px-3 rounded-[6px] bg-white border border-[#daddd4] hover:border-[#2e1065] text-xs font-semibold text-[#20231e] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
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

          {/* Category Quick Tabs */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-2 mb-6 font-display">
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, category: "all" }))
                }
                className={`px-3.5 py-1.5 rounded-[6px] text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  filters.category === "all"
                    ? "border border-[#2e1065] bg-[#2e1065]/[0.06] text-[#2e1065]"
                    : "text-[#62665d] hover:text-[#20231e]"
                }`}
              >
                All ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, category: cat.key }))
                  }
                  className={`px-3.5 py-1.5 rounded-[6px] text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    filters.category === cat.key
                      ? "border border-[#2e1065] bg-[#2e1065]/[0.06] text-[#2e1065]"
                      : "text-[#62665d] hover:text-[#20231e]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {searchQuery && (
            <div className="mb-5 flex items-center justify-between text-xs text-[#62665d] bg-white px-3.5 py-2.5 rounded-[6px] border border-[#daddd4]">
              <span>
                Showing results for{" "}
                <strong className="text-[#20231e]">&ldquo;{searchQuery}&rdquo;</strong>
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-[#2e1065] font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          )}

          {/* Product Grid */}
          {visibleProducts.length === 0 ? (
            <div className="py-16 text-center bg-white border border-[#daddd4] rounded-[8px]">
              <Package className="w-10 h-10 text-[#9aa092] mx-auto mb-3" />
              <p className="font-display text-base font-semibold text-[#20231e]">
                No products match your filters
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-3 px-4 py-2 rounded-[6px] bg-[#2e1065] text-white text-xs font-bold cursor-pointer"
              >
                Reset all filters
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

          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                className="px-6 py-2.5 rounded-[6px] bg-white hover:bg-[#f3f4ef] border border-[#daddd4] font-display text-xs sm:text-sm font-semibold text-[#20231e] transition cursor-pointer"
              >
                Load More Products ({filteredProducts.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      </main>

      <StorefrontFooter
        store={store}
        onTrackOrder={() => setTrackModalOpen(true)}
      />

      <FilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        products={products}
        filters={filters}
        onChange={(next) => {
          setFilters(next);
          setVisibleCount(ITEMS_PER_PAGE);
        }}
        onReset={resetFilters}
      />

      <FloatingWhatsApp store={store} />
      <FloatingCartBar />
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
