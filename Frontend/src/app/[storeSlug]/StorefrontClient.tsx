"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { FloatingCartBar } from "@/components/storefront/FloatingCartBar";
import { CheckoutDrawer } from "@/components/storefront/CheckoutDrawer";
import { ProductCard } from "@/components/storefront/ProductCard";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import { api, API_BASE_URL } from "@/lib/api";
import {
  ShieldCheck,
  ShoppingBag,
  MessageCircle,
  Package,
  Search,
  X,
  Clock,
  CheckCircle2,
  Truck,
  ChevronRight,
  Loader2,
  SlidersHorizontal,
  MapPin,
  Phone,
  Mail,
  ArrowDown,
  Menu,
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
  isFeatured?: boolean;
  basePrice: number | string;
  comparePrice?: number | string | null;
  images: string[];
  stockQuantity: number;
  hasVariants: boolean;
  variants: Variant[];
}

interface SocialLinks {
  instagram?: string | null;
  tiktok?: string | null;
  facebook?: string | null;
  twitter?: string | null;
}

interface StoreData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  themeColor: string;
  whatsappNumber: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  address?: string | null;
  socialLinks?: SocialLinks | null;
  currency: string;
  verifiedOrdersCount?: number;
  products: Product[];
}

function toSocialUrl(platform: keyof SocialLinks, raw?: string | null): string | null {
  const val = raw?.trim();
  if (!val) return null;
  if (/^https?:\/\//i.test(val)) return val;
  const handle = val.replace(/^@/, "");
  const bases: Record<keyof SocialLinks, string> = {
    instagram: `https://instagram.com/${handle}`,
    tiktok: `https://tiktok.com/@${handle}`,
    facebook: `https://facebook.com/${handle}`,
    twitter: `https://x.com/${handle}`,
  };
  return bases[platform];
}

const ITEMS_PER_PAGE = 20;

export function StorefrontClient({ store }: { store: StoreData }) {
  const { addItem, openCart, getTotalCount } = useCartStore();
  const cartCount = getTotalCount();

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "sale">("newest");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Track Order Modal State
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [trackInput, setTrackInput] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedOrders, setTrackedOrders] = useState<any[] | null>(null);
  const [trackError, setTrackError] = useState("");

  const getFullImageUrl = (path?: string) => getImageUrl(path);

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
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

  // Dynamically extract custom merchant categories from active products
  const customCategories = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    store.products.forEach((p) => {
      if (p.category && p.category.trim()) {
        const key = p.category.trim().toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(key, { label: p.category.trim(), count: 1 });
        }
      }
    });
    return Array.from(map.entries()).map(([key, { label, count }]) => ({
      key,
      label,
      count,
    }));
  }, [store.products]);

  // Top 5 categories by product count for clean header navigation
  const headerCategories = useMemo(() => {
    return [...customCategories]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [customCategories]);

  const handleCategoryNav = (catKey: string) => {
    setSelectedCategory(catKey);
    setVisibleCount(ITEMS_PER_PAGE);
    setMobileMenuOpen(false);
    const el = document.getElementById("catalogue");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // Top 4 Curated / Featured Arrivals
  const topArrivals = useMemo(() => {
    const featured = store.products.filter((p) => p.isFeatured);
    if (featured.length >= 4) return featured.slice(0, 4);
    return store.products.slice(0, 4);
  }, [store.products]);

  // Filtered & Sorted Products for the Main Catalogue
  const filteredProducts = useMemo(() => {
    let list = [...store.products];

    // Category filter
    if (selectedCategory !== "all") {
      list = list.filter(
        (p) => (p.category || "").trim().toLowerCase() === selectedCategory
      );
    }

    // Search query filter
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

    // Sort
    if (sortBy === "price-asc") {
      list.sort((a, b) => Number(a.basePrice) - Number(b.basePrice));
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => Number(b.basePrice) - Number(a.basePrice));
    } else if (sortBy === "sale") {
      list = list.filter(
        (p) => p.comparePrice && Number(p.comparePrice) > Number(p.basePrice)
      );
    }

    return list;
  }, [store.products, selectedCategory, searchQuery, sortBy]);

  const displayedCatalogue = filteredProducts.slice(0, visibleCount);

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackInput.trim()) return;
    setTrackingLoading(true);
    setTrackError("");
    try {
      const res = await api.get(
        `/public/stores/${store.slug}/track?q=${encodeURIComponent(trackInput.trim())}`
      );
      setTrackedOrders(res.data.data.orders || []);
    } catch (err: any) {
      setTrackError(
        err.response?.data?.message || "Could not look up orders. Please check your phone or order number."
      );
      setTrackedOrders(null);
    } finally {
      setTrackingLoading(false);
    }
  };

  // WhatsApp deep link
  const cleanPhone = store.whatsappNumber.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/234${
    cleanPhone.startsWith("0") ? cleanPhone.slice(1) : cleanPhone
  }?text=Hi%20${encodeURIComponent(
    store.name
  )},%20I'm%20browsing%20your%20storefront%20on%20Kredibly!`;

  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#20231e] font-sans pb-24">
      {/* 1. Top Sticky Store Header */}
      <header className="sticky top-0 z-30 bg-[#fafaf8]/95 backdrop-blur-md border-b border-[#daddd4]">
        <div className="mx-auto w-[min(1180px,calc(100%-32px))] md:w-[min(1180px,calc(100%-48px))] py-3.5 flex items-center justify-between gap-3">
          {/* Left: Hamburger (Mobile) + Brand Identity */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle store menu"
              className="lg:hidden p-2 rounded-[6px] bg-[#f3f4ef] hover:bg-[#e6e8e1] border border-[#daddd4] text-[#20231e] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <Link href={`/${store.slug}`} className="flex items-center gap-2.5 min-w-0">
              {store.logoUrl ? (
                <img
                  src={getFullImageUrl(store.logoUrl)}
                  alt={store.name}
                  className="h-9 w-9 rounded-[6px] object-cover border border-[#daddd4] shrink-0"
                />
              ) : (
                <div className="h-9 w-9 rounded-[6px] bg-[#2e1065] flex items-center justify-center font-display font-extrabold text-white text-sm shrink-0">
                  {store.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="font-display text-[15px] sm:text-[17px] leading-tight font-extrabold text-[#20231e] tracking-[-0.5px] uppercase truncate">
                  {store.name}
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Top 5 Category Links (Desktop) */}
          {headerCategories.length > 0 && (
            <nav className="hidden lg:flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleCategoryNav("all")}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer ${
                  selectedCategory === "all"
                    ? "bg-[#2e1065] text-white"
                    : "text-[#62665d] hover:text-[#20231e] hover:bg-[#f3f4ef]"
                }`}
              >
                All
              </button>
              {headerCategories.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => handleCategoryNav(cat.key)}
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat.key
                      ? "bg-[#2e1065] text-white"
                      : "text-[#62665d] hover:text-[#20231e] hover:bg-[#f3f4ef]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </nav>
          )}

          {/* Header Actions: Track Order, Search & Cart Bag */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setTrackModalOpen(true)}
              className="hidden sm:flex px-3 py-2 rounded-[6px] bg-[#f3f4ef] hover:bg-[#e6e8e1] border border-[#daddd4] text-[11.5px] sm:text-[12.5px] font-semibold text-[#20231e] items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-[#3b0764]" />
              <span>Track Order</span>
            </button>

            <button
              type="button"
              onClick={() => setHeaderSearchOpen((prev) => !prev)}
              aria-label="Search products"
              className="p-2.5 rounded-[6px] bg-[#f3f4ef] hover:bg-[#e6e8e1] border border-[#daddd4] text-[#20231e] flex items-center justify-center transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={openCart}
              aria-label="Open shopping bag"
              className="relative p-2.5 rounded-[6px] bg-[#f3f4ef] hover:bg-[#e6e8e1] border border-[#daddd4] text-[#20231e] flex items-center justify-center transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#2e1065] text-white text-[10px] font-mono font-bold flex items-center justify-center leading-none shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Hamburger Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#daddd4] bg-[#fafaf8] py-3">
            <div className="mx-auto w-[min(1180px,calc(100%-32px))] space-y-1">
              <button
                type="button"
                onClick={() => handleCategoryNav("all")}
                className={`w-full text-left px-3 py-2 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer ${
                  selectedCategory === "all"
                    ? "bg-[#2e1065] text-white"
                    : "text-[#20231e] hover:bg-[#f3f4ef]"
                }`}
              >
                All Products
              </button>
              {headerCategories.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => handleCategoryNav(cat.key)}
                  className={`w-full text-left px-3 py-2 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer ${
                    selectedCategory === cat.key
                      ? "bg-[#2e1065] text-white"
                      : "text-[#20231e] hover:bg-[#f3f4ef]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
              <div className="pt-1.5 mt-1.5 border-t border-[#e6e8e1]">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setTrackModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-[6px] text-xs font-semibold text-[#20231e] hover:bg-[#f3f4ef] flex items-center gap-2 cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5 text-[#3b0764]" />
                  <span>Track Order</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {headerSearchOpen && (
          <div className="border-t border-[#daddd4] bg-[#fafaf8] py-2.5">
            <div className="mx-auto w-[min(1180px,calc(100%-32px))] md:w-[min(1180px,calc(100%-48px))] relative flex items-center">
              <Search className="w-4 h-4 text-[#62665d] absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${store.name} products...`}
                className="w-full h-10 pl-10 pr-9 rounded-[6px] bg-white border border-[#daddd4] text-xs sm:text-sm text-[#20231e] placeholder-[#62665d] focus:outline-none focus:border-[#2e1065]"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-3 text-[#62665d] hover:text-[#20231e] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setHeaderSearchOpen(false)}
                  aria-label="Close search"
                  className="absolute right-3 text-[#62665d] hover:text-[#20231e] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. Store Hero Section (Banner-backed when uploaded, clean compact header by default) */}
      {store.bannerUrl ? (
        <section className="relative w-full border-b border-[#daddd4] overflow-hidden bg-slate-950">
          <img
            src={getFullImageUrl(store.bannerUrl)}
            alt={store.name}
            className="absolute inset-0 w-full h-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/55 to-slate-950/35" />
          <div className="relative mx-auto w-[min(1180px,calc(100%-32px))] md:w-[min(1180px,calc(100%-48px))] py-12 sm:py-20 text-center max-w-2xl space-y-4">
            <h1 className="font-display text-[clamp(28px,4.2vw,46px)] leading-[1.12] tracking-[-1.2px] font-bold text-white m-0">
              {store.name}
            </h1>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-xl mx-auto">
              {store.description || `Browse and shop directly from ${store.name}.`}
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="#catalogue"
                className="px-5 py-2.5 rounded-[6px] bg-white hover:bg-slate-100 text-[#0f172a] font-display font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition"
              >
                <span>Browse Products</span>
                <ArrowDown className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-[11px] text-slate-300 flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-white/90" />
              <span>Protected by Kredibly Escrow • Instant Checkout</span>
            </p>
          </div>
        </section>
      ) : (
        <section className="w-full bg-[#fafaf8] border-b border-[#daddd4]">
          <div className="mx-auto w-[min(1180px,calc(100%-32px))] md:w-[min(1180px,calc(100%-48px))] py-8 sm:py-12 text-center max-w-2xl space-y-3.5">
            <h1 className="font-display text-[clamp(28px,4vw,42px)] leading-[1.15] tracking-[-1.2px] font-bold text-[#20231e] m-0">
              {store.name}
            </h1>
            <p className="text-sm sm:text-base text-[#62665d] leading-relaxed max-w-xl mx-auto">
              {store.description || `Shop directly from ${store.name}. Fast delivery & verified checkout.`}
            </p>
            <div className="pt-1.5 flex items-center justify-center">
              <a
                href="#catalogue"
                className="px-5 py-2.5 rounded-[6px] bg-[#2e1065] hover:bg-[#3b0764] text-white font-display font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition"
              >
                <span>Browse Products</span>
                <ArrowDown className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-[11px] text-[#62665d] flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#3b0764]" />
              <span>Protected by Kredibly Escrow • Instant Checkout</span>
            </p>
          </div>
        </section>
      )}

      {/* 3. Section 1: Curated Arrivals (Only shown when not searching and store has >4 products) */}
      {!searchQuery && selectedCategory === "all" && store.products.length > 4 && (
        <section className="py-14 sm:py-20 bg-[#fafaf8]">
          <div className="mx-auto w-[min(1180px,calc(100%-32px))] md:w-[min(1180px,calc(100%-48px))]">
            <div className="flex flex-row items-end justify-between mb-7 sm:mb-10 gap-4">
              <div>
                <p className="text-[8px] sm:text-[10px] tracking-[1.8px] sm:tracking-[2.2px] font-semibold uppercase text-[#62665d] mb-2.5 sm:mb-3">
                  CURATED ARRIVALS
                </p>
                <h2 className="font-display text-[clamp(26px,3.5vw,42px)] leading-[1.18] font-semibold text-[#20231e] tracking-[-1.6px] m-0">
                  Top Products
                </h2>
              </div>
              <a
                href="#catalogue"
                className="text-[12px] sm:text-[13px] text-[#20231e] font-semibold hover:bg-[#e6e8e1]/60 rounded-[6px] px-3 py-2 flex items-center gap-1 transition-all shrink-0"
              >
                <span>Explore All</span>
                <ChevronRight className="w-4 h-4" />
              </a>
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

      {/* 4. Section 2: Main Catalogue with Dynamic Custom Category Tabs & Sort (bg-[#f3f4ef]) */}
      <section
        id="catalogue"
        className="py-14 sm:py-20 bg-[#f3f4ef] border-y border-[#daddd4]"
      >
        <div className="mx-auto w-[min(1180px,calc(100%-32px))] md:w-[min(1180px,calc(100%-48px))]">
          {/* Section Header + Sort Selector */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 sm:mb-6 gap-4">
            <div>
              <p className="text-[8px] sm:text-[10px] tracking-[1.8px] sm:tracking-[2.2px] font-semibold uppercase text-[#62665d] mb-2.5 sm:mb-3">
                HANDPICKED COLLECTION
              </p>
              <h2 className="font-display text-[clamp(26px,3.5vw,42px)] leading-[1.18] font-semibold text-[#20231e] tracking-[-1.6px] m-0">
                {selectedCategory === "all"
                  ? "Featured Picks"
                  : customCategories.find((c) => c.key === selectedCategory)
                      ?.label || "Collection"}
              </h2>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 self-start sm:self-end">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#62665d]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-9 px-3 rounded-[6px] bg-white border border-[#daddd4] text-[12.5px] font-semibold text-[#20231e] outline-none focus:border-[#2e1065]"
              >
                <option value="newest">Sort: Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="sale">On Sale / Discounted</option>
              </select>
            </div>
          </div>

          {/* Dynamic Custom Category Filter Pills (Mobiletrends Exact Style) */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1 mb-7 sm:mb-9 font-display">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              className={`px-3.5 sm:px-4 py-2 rounded-[6px] text-[13px] sm:text-[14.5px] font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                selectedCategory === "all"
                  ? "border border-[#2e1065] bg-[#2e1065]/[0.06] text-[#2e1065] shadow-2xs"
                  : "text-[#62665d] hover:text-[#20231e] hover:bg-black/[0.03]"
              }`}
            >
              All items ({store.products.length})
            </button>

            {customCategories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.key);
                  setVisibleCount(ITEMS_PER_PAGE);
                }}
                className={`px-3.5 sm:px-4 py-2 rounded-[6px] text-[13px] sm:text-[14.5px] font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedCategory === cat.key
                    ? "border border-[#2e1065] bg-[#2e1065]/[0.06] text-[#2e1065] shadow-2xs"
                    : "text-[#62665d] hover:text-[#20231e] hover:bg-black/[0.03]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          {displayedCatalogue.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-[6px] border border-[#e6e8e1] space-y-3">
              <Package className="w-10 h-10 text-[#62665d] mx-auto stroke-[1.5]" />
              <h3 className="font-display text-base font-bold text-[#20231e]">
                No matching products found
              </h3>
              <p className="text-xs text-[#62665d] max-w-xs mx-auto">
                {searchQuery
                  ? `No items matched "${searchQuery}". Try clearing your search filter.`
                  : "This store hasn't added products to this category yet."}
              </p>
              {(searchQuery || selectedCategory !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  className="px-4 py-2 rounded-[6px] bg-[#2e1065] text-white text-xs font-semibold"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-[13px] gap-y-[25px] sm:gap-x-[18px] sm:gap-y-[30px] lg:gap-x-[20px] lg:gap-y-[32px]">
                {displayedCatalogue.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    store={store}
                    onAddToCart={handleQuickAdd}
                  />
                ))}
              </div>

              {/* Load More Pagination Button */}
              {visibleCount < filteredProducts.length && (
                <div className="mt-12 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                    className="px-6 py-3 rounded-[6px] bg-white hover:bg-[#fafaf8] border border-[#daddd4] text-[13px] font-display font-bold text-[#20231e] shadow-2xs transition-colors cursor-pointer"
                  >
                    Load More Products (Showing {displayedCatalogue.length} of{" "}
                    {filteredProducts.length})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Track Order Modal (Phone-First Lookup without Login) */}
      {trackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-[#daddd4] rounded-[8px] p-6 shadow-2xl space-y-5 text-[#20231e]">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6e8e1]">
              <div>
                <h3 className="font-display text-lg font-bold text-[#20231e]">
                  Track Your Order
                </h3>
                <p className="text-xs text-[#62665d]">
                  Enter the phone number or order number (#KRD-...) used at checkout
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTrackModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#f3f4f6] hover:bg-[#e5e7eb] flex items-center justify-center text-[#20231e]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTrackOrder} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="e.g. 08031234567 or KRD-1049"
                value={trackInput}
                onChange={(e) => setTrackInput(e.target.value)}
                className="flex-1 h-[44px] px-3.5 rounded-[6px] bg-[#f4f5f7] focus:bg-white border border-[#e2e8f0] focus:border-[#2e1065] text-[13.5px] text-[#0f172a] outline-none"
              />
              <button
                type="submit"
                disabled={trackingLoading}
                className="px-5 h-[44px] rounded-[6px] bg-[#2e1065] hover:bg-[#1e1b4b] text-white text-xs font-semibold flex items-center justify-center shrink-0"
              >
                {trackingLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Find</span>
                )}
              </button>
            </form>

            {trackError && (
              <p className="text-xs text-red-600 bg-red-50 p-3 rounded-[6px] border border-red-200">
                {trackError}
              </p>
            )}

            {trackedOrders && (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {trackedOrders.length === 0 ? (
                  <p className="text-xs text-[#62665d] text-center py-4">
                    No orders found matching &ldquo;{trackInput}&rdquo; in {store.name}.
                  </p>
                ) : (
                  trackedOrders.map((ord) => (
                    <Link
                      key={ord.id}
                      href={`/${store.slug}/orders/${ord.orderNumber}`}
                      onClick={() => setTrackModalOpen(false)}
                      className="block p-3.5 rounded-[6px] bg-[#fafaf8] hover:bg-[#f3f4ef] border border-[#daddd4] transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[#2e1065]">
                          #{ord.orderNumber}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#2e1065]/10 text-[#2e1065]">
                          {ord.orderStatus}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-[#20231e] truncate">
                        {ord.items
                          ?.map((i: any) => `${i.productTitle} (x${i.quantity})`)
                          .join(", ")}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-[#62665d]">
                        <span>{formatCurrency(Number(ord.totalAmount))}</span>
                        <span className="underline font-semibold text-[#2e1065]">
                          View Full Receipt →
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Minimalist Storefront Footer */}
      <footer className="mt-12 border-t border-[#daddd4] bg-white">
        <div className="mx-auto w-[min(1180px,calc(100%-32px))] md:w-[min(1180px,calc(100%-48px))] py-8">
          {/* Row 1: Brand & Contact/Socials */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                {store.logoUrl ? (
                  <img
                    src={getFullImageUrl(store.logoUrl)}
                    alt={store.name}
                    className="h-7 w-7 rounded-[6px] object-cover border border-[#daddd4]"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-[6px] bg-[#2e1065] flex items-center justify-center font-display font-extrabold text-white text-xs">
                    {store.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-display text-sm font-extrabold uppercase tracking-tight text-[#20231e]">
                  {store.name}
                </span>
              </div>
              {store.address && (
                <p className="text-xs text-[#62665d] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#3b0764] shrink-0" />
                  <span>{store.address}</span>
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {(store.contactPhone || store.whatsappNumber) && (
                <a
                  href={`tel:${store.contactPhone || store.whatsappNumber}`}
                  className="px-3 py-1.5 rounded-[6px] bg-[#f3f4ef] hover:bg-[#e6e8e1] border border-[#daddd4] font-semibold text-[#20231e] inline-flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#3b0764]" />
                  <span>{store.contactPhone || store.whatsappNumber}</span>
                </a>
              )}
              {store.contactEmail && (
                <a
                  href={`mailto:${store.contactEmail}`}
                  className="px-3 py-1.5 rounded-[6px] bg-[#f3f4ef] hover:bg-[#e6e8e1] border border-[#daddd4] font-semibold text-[#20231e] inline-flex items-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-[#3b0764]" />
                  <span>{store.contactEmail}</span>
                </a>
              )}
              {(
                [
                  { key: "instagram", label: "Instagram" },
                  { key: "tiktok", label: "TikTok" },
                  { key: "facebook", label: "Facebook" },
                  { key: "twitter", label: "X" },
                ] as const
              ).map(({ key, label }) => {
                const href = toSocialUrl(key, store.socialLinks?.[key]);
                if (!href) return null;
                return (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-[6px] bg-[#f3f4ef] hover:bg-[#e6e8e1] border border-[#daddd4] font-semibold text-[#20231e] transition-colors"
                  >
                    {label}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Row 2: Hairline Meta */}
          <div className="mt-6 pt-5 border-t border-[#e6e8e1] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#62665d]">
            <span>© {new Date().getFullYear()} {store.name}</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTrackModalOpen(true)}
                className="hover:text-[#20231e] font-medium cursor-pointer"
              >
                Track Order
              </button>
              <span>·</span>
              <span>
                Powered by{" "}
                <a
                  href="https://usekredibly.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#2e1065] hover:underline"
                >
                  Kredibly
                </a>
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Sticky Bottom Cart Bar */}
      <FloatingCartBar />

      {/* Slide-over Cart & 1-Step Checkout Drawers */}
      <CartDrawer
        onCheckoutClick={() => {
          setCheckoutOpen(true);
        }}
      />

      <CheckoutDrawer
        storeSlug={store.slug}
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
    </div>
  );
}
