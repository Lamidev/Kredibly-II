"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { useShopperStore } from "@/store/useShopperStore";
import { api } from "@/lib/api";
import { formatCurrency, getImageUrl, getStorePath } from "@/lib/utils";
import { StoreData, extractStoreCategories } from "@/types/storefront";
import { Menu, X, Search, ShoppingBag, Truck, Loader2, User, Package, Home, ChevronDown, Info } from "lucide-react";

interface StorefrontHeaderProps {
  store: StoreData;
  topBanner?: string | null;
  selectedCategory?: string;
  onSelectCategory?: (categoryKey: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  trackModalOpen?: boolean;
  onOpenTrackModal?: () => void;
  onCloseTrackModal?: () => void;
}

export function StorefrontHeader({
  store,
  topBanner,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  trackModalOpen: controlledTrackOpen,
  onOpenTrackModal,
  onCloseTrackModal,
}: StorefrontHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { openCart, getTotalCount } = useCartStore();
  const { token: shopperToken, storeSlug: loadedSlug, loadShopper } =
    useShopperStore();
  const cartCount = getTotalCount();

  useEffect(() => {
    if (loadedSlug !== store.slug) {
      loadShopper(store.slug);
    }
  }, [store.slug, loadedSlug, loadShopper]);

  const isShopperLoggedIn = Boolean(shopperToken && loadedSlug === store.slug);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [showAllMobileCats, setShowAllMobileCats] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const [localSearch, setLocalSearch] = useState(searchQuery || "");

  // Track Order modal (supports controlled or internal state)
  const [internalTrackOpen, setInternalTrackOpen] = useState(false);
  const isTrackOpen =
    controlledTrackOpen !== undefined ? controlledTrackOpen : internalTrackOpen;
  const openTrack = () => {
    if (onOpenTrackModal) onOpenTrackModal();
    else setInternalTrackOpen(true);
  };
  const closeTrack = () => {
    if (onCloseTrackModal) onCloseTrackModal();
    else setInternalTrackOpen(false);
  };

  const [trackInput, setTrackInput] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedOrders, setTrackedOrders] = useState<any[] | null>(null);
  const [trackError, setTrackError] = useState("");

  const categories = extractStoreCategories(store.products || []);
  const sortedCategories = [...categories].sort((a, b) => b.count - a.count);
  const inlineCategories = sortedCategories.slice(0, 4);
  const overflowCategories = sortedCategories.slice(4);

  const homePath = getStorePath(store.slug);
  const aboutPath = getStorePath(store.slug, "/about");
  const isHomeActive = pathname === homePath && !selectedCategory;
  const isAboutActive = pathname === aboutPath;

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleCategoryClick = (catKey: string) => {
    setMobileMenuOpen(false);
    setMoreMenuOpen(false);
    if (onSelectCategory) {
      onSelectCategory(catKey);
      const el = document.getElementById("catalogue");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      const target =
        catKey === "all"
          ? getStorePath(store.slug, "/products")
          : getStorePath(store.slug, `/products?category=${encodeURIComponent(catKey)}`);
      router.push(target);
    }
  };

  const handleSearchInput = (val: string) => {
    setLocalSearch(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSearchChange && localSearch.trim()) {
      router.push(
        getStorePath(store.slug, `/products?q=${encodeURIComponent(localSearch.trim())}`)
      );
      setHeaderSearchOpen(false);
    }
  };

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
        err.response?.data?.message ||
          "Could not locate order. Enter your exact order number (e.g. KRD-9384207)."
      );
      setTrackedOrders(null);
    } finally {
      setTrackingLoading(false);
    }
  };

  const activeSearchVal = searchQuery !== undefined ? searchQuery : localSearch;

  return (
    <>
      <div className="sticky top-0 z-30">
        {topBanner && (
          <div className="w-full bg-[#2e1065] text-white text-center py-2 px-4 text-[11px] sm:text-xs font-semibold tracking-wide">
            {topBanner}
          </div>
        )}
        <header className="bg-[#fafaf8]/95 backdrop-blur-md border-b border-[#daddd4]">
        <div className="mx-auto w-[min(1180px,calc(100%-24px))] md:w-[min(1180px,calc(100%-48px))] py-2.5 sm:py-3 flex items-center justify-between gap-2">
          {/* Left: Borderless Hamburger (Mobile) + Brand Identity */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle store menu"
              className="lg:hidden p-1 text-[#20231e] hover:text-[#2e1065] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            <Link
              href={getStorePath(store.slug)}
              className="flex items-center gap-2 sm:gap-2.5 min-w-0"
            >
              {store.logoUrl ? (
                <img
                  src={getImageUrl(store.logoUrl)}
                  alt={store.name}
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-[6px] object-cover border border-[#daddd4] shrink-0"
                />
              ) : (
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-[6px] bg-[#2e1065] flex items-center justify-center font-display font-extrabold text-white text-xs sm:text-sm shrink-0">
                  {store.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-display text-[12.5px] sm:text-[17px] leading-[1.15] font-extrabold text-[#20231e] tracking-[-0.3px] sm:tracking-[-0.5px] uppercase line-clamp-2">
                {store.name}
              </span>
            </Link>
          </div>

          {/* Center: Constant Home + Categories (with More dropdown if > 4) + Constant About (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              href={homePath}
              className={`px-3 py-1.5 rounded-[6px] text-xs transition-colors whitespace-nowrap ${
                isHomeActive
                  ? "text-[#20231e] font-bold underline underline-offset-4"
                  : "font-semibold text-[#62665d] hover:text-[#20231e] hover:bg-[#f3f4ef]"
              }`}
            >
              Home
            </Link>

            {inlineCategories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => handleCategoryClick(cat.key)}
                className={`px-3 py-1.5 rounded-[6px] text-xs transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.key
                    ? "text-[#20231e] font-bold underline underline-offset-4"
                    : "font-semibold text-[#62665d] hover:text-[#20231e] hover:bg-[#f3f4ef]"
                }`}
              >
                {cat.label}
              </button>
            ))}

            {overflowCategories.length > 0 && (
              <div className="relative" ref={moreMenuRef}>
                <button
                  type="button"
                  onClick={() => setMoreMenuOpen((prev) => !prev)}
                  className="px-3 py-1.5 rounded-[6px] text-xs font-semibold text-[#62665d] hover:text-[#20231e] hover:bg-[#f3f4ef] inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>More</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {moreMenuOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-52 max-h-72 overflow-y-auto rounded-xl bg-white border border-[#daddd4] shadow-lg py-1.5 z-50">
                    <button
                      type="button"
                      onClick={() => handleCategoryClick("all")}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#20231e] hover:bg-[#f3f4ef] transition-colors cursor-pointer"
                    >
                      All Products
                    </button>
                    <div className="my-1 border-t border-[#e6e8e1]" />
                    {overflowCategories.map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => handleCategoryClick(cat.key)}
                        className={`w-full text-left px-3.5 py-2 text-xs transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                          selectedCategory === cat.key
                            ? "font-bold text-[#2e1065] bg-[#f3f4ef]"
                            : "font-medium text-[#20231e] hover:bg-[#f3f4ef]"
                        }`}
                      >
                        <span className="truncate">{cat.label}</span>
                        <span className="text-[10px] font-mono text-[#62665d]">{cat.count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Link
              href={aboutPath}
              className={`px-3 py-1.5 rounded-[6px] text-xs transition-colors whitespace-nowrap ${
                isAboutActive
                  ? "text-[#20231e] font-bold underline underline-offset-4"
                  : "font-semibold text-[#62665d] hover:text-[#20231e] hover:bg-[#f3f4ef]"
              }`}
            >
              About
            </Link>
          </nav>

          {/* Right: Track Order (Desktop), Borderless Search & Shopping Bag */}
          <div className="flex items-center justify-end gap-0.5 sm:gap-2.5 shrink-0 lg:flex-1">
            <button
              type="button"
              onClick={openTrack}
              className="hidden sm:flex px-3 py-2 rounded-[6px] bg-[#f3f4ef] hover:bg-[#e6e8e1] border border-[#daddd4] text-[12px] font-semibold text-[#20231e] items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-[#3b0764]" />
              <span>Track Order</span>
            </button>

            <button
              type="button"
              onClick={() => setHeaderSearchOpen((prev) => !prev)}
              aria-label="Search products"
              className="p-1.5 sm:p-2 text-[#20231e] hover:text-[#2e1065] flex items-center justify-center transition-colors cursor-pointer"
            >
              <Search className="w-5 h-5" />
            </button>

            <Link
              href={
                isShopperLoggedIn
                  ? getStorePath(store.slug, "/account")
                  : getStorePath(store.slug, "/account/login")
              }
              aria-label={isShopperLoggedIn ? "My Account" : "Sign in"}
              className="relative p-1.5 sm:p-2 text-[#20231e] hover:text-[#2e1065] flex items-center justify-center transition-colors"
            >
              <User className="w-5 h-5" />
              {isShopperLoggedIn && (
                <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </Link>

            <button
              type="button"
              onClick={openCart}
              aria-label="Open shopping bag"
              className="relative p-1.5 sm:p-2 text-[#20231e] hover:text-[#2e1065] flex items-center justify-center transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#2e1065] text-white text-[10px] font-mono font-bold flex items-center justify-center leading-none shadow-sm">
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
              <Link
                href={homePath}
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full text-left px-3 py-2 rounded-[6px] text-xs flex items-center gap-2 transition-colors ${
                  isHomeActive
                    ? "font-bold text-[#20231e] bg-[#f3f4ef]"
                    : "font-semibold text-[#20231e] hover:bg-[#f3f4ef]"
                }`}
              >
                <Home className="w-3.5 h-3.5 text-[#3b0764]" />
                <span>Home</span>
              </Link>
              <button
                type="button"
                onClick={() => handleCategoryClick("all")}
                className={`w-full text-left px-3 py-2 rounded-[6px] text-xs transition-colors cursor-pointer ${
                  selectedCategory === "all"
                    ? "text-[#20231e] font-bold bg-[#f3f4ef]"
                    : "font-semibold text-[#20231e] hover:bg-[#f3f4ef]"
                }`}
              >
                All Products
              </button>
              {sortedCategories.length > 0 && (
                <div className={showAllMobileCats ? "max-h-56 overflow-y-auto space-y-1 pr-1" : "space-y-1"}>
                  {(showAllMobileCats ? sortedCategories : sortedCategories.slice(0, 5)).map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => handleCategoryClick(cat.key)}
                      className={`w-full text-left px-3 py-2 rounded-[6px] text-xs transition-colors cursor-pointer flex items-center justify-between ${
                        selectedCategory === cat.key
                          ? "text-[#20231e] font-bold bg-[#f3f4ef]"
                          : "font-semibold text-[#20231e] hover:bg-[#f3f4ef]"
                      }`}
                    >
                      <span className="truncate">{cat.label}</span>
                      <span className="text-[10px] font-mono text-[#62665d]">{cat.count}</span>
                    </button>
                  ))}
                </div>
              )}
              {sortedCategories.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllMobileCats((prev) => !prev)}
                  className="w-full text-left px-3 py-1.5 text-[11px] font-semibold text-[#2e1065] hover:underline cursor-pointer"
                >
                  {showAllMobileCats
                    ? "Show fewer categories"
                    : `Show all ${sortedCategories.length} categories`}
                </button>
              )}
              <Link
                href={aboutPath}
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full text-left px-3 py-2 rounded-[6px] text-xs flex items-center gap-2 transition-colors ${
                  isAboutActive
                    ? "font-bold text-[#20231e] bg-[#f3f4ef]"
                    : "font-semibold text-[#20231e] hover:bg-[#f3f4ef]"
                }`}
              >
                <Info className="w-3.5 h-3.5 text-[#3b0764]" />
                <span>About</span>
              </Link>
              <div className="pt-1.5 mt-1.5 border-t border-[#e6e8e1]">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openTrack();
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

        {/* Expandable Search Bar */}
        {headerSearchOpen && (
          <div className="border-t border-[#daddd4] bg-[#fafaf8] py-2.5">
            <form
              onSubmit={handleSearchSubmit}
              className="mx-auto w-[min(1180px,calc(100%-32px))] md:w-[min(1180px,calc(100%-48px))] relative flex items-center"
            >
              <Search className="w-4 h-4 text-[#62665d] absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={activeSearchVal}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder={`Search ${store.name} products...`}
                className="w-full h-10 pl-10 pr-9 rounded-[6px] bg-white border border-[#daddd4] text-xs sm:text-sm text-[#20231e] placeholder-[#62665d] focus:outline-none focus:border-[#2e1065]"
              />
              <button
                type="button"
                onClick={() => {
                  if (activeSearchVal) {
                    handleSearchInput("");
                  } else {
                    setHeaderSearchOpen(false);
                  }
                }}
                aria-label="Clear or close search"
                className="absolute right-3 text-[#62665d] hover:text-[#20231e] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
        </header>
      </div>

      {/* Track Order Modal */}
      {isTrackOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white border border-[#daddd4] rounded-[12px] p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-[#20231e]">
                  Track Your Order
                </h3>
                <p className="text-xs text-[#62665d]">
                  Enter your order number (e.g. KRD-9384207).
                </p>
              </div>
              <button
                type="button"
                onClick={closeTrack}
                className="w-8 h-8 rounded-full bg-[#f3f4f6] hover:bg-[#e5e7eb] flex items-center justify-center text-[#20231e] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTrackOrder} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="e.g. KRD-9384207"
                value={trackInput}
                onChange={(e) => setTrackInput(e.target.value.toUpperCase())}
                className="flex-1 h-[44px] px-3.5 rounded-[6px] bg-[#f4f5f7] focus:bg-white border border-[#e2e8f0] focus:border-[#2e1065] text-[13.5px] font-mono uppercase text-[#0f172a] outline-none"
              />
              <button
                type="submit"
                disabled={trackingLoading}
                className="px-5 h-[44px] rounded-[6px] bg-[#2e1065] hover:bg-[#1e1b4b] text-white text-xs font-semibold flex items-center justify-center shrink-0 cursor-pointer"
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
                    No orders found matching &ldquo;{trackInput}&rdquo; in{" "}
                    {store.name}.
                  </p>
                ) : (
                  trackedOrders.map((ord) => {
                    const firstThumb = ord.items?.[0]?.product?.images?.[0];
                    const extraCount = (ord.items?.length || 0) - 1;
                    return (
                      <Link
                        key={ord.id}
                        href={getStorePath(store.slug, `/orders/${ord.orderNumber}`)}
                        onClick={closeTrack}
                        className="flex items-center gap-3 p-3.5 rounded-[8px] bg-[#fafaf8] hover:bg-[#f3f4ef] border border-[#daddd4] transition-colors"
                      >
                        <div className="relative h-12 w-12 rounded-lg bg-white border border-[#daddd4] overflow-hidden shrink-0 flex items-center justify-center">
                          {firstThumb ? (
                            <img
                              src={getImageUrl(firstThumb)}
                              alt={ord.items?.[0]?.productTitle || ord.orderNumber}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-[#c5c8be]" />
                          )}
                          {extraCount > 0 && (
                            <span className="absolute bottom-0 right-0 px-1 rounded-tl bg-[#2e1065] text-white text-[9px] font-bold">
                              +{extraCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
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
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
