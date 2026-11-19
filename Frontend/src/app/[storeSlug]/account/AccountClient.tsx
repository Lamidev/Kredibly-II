"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatCurrency, getImageUrl, getStorePath } from "@/lib/utils";
import { useShopperStore } from "@/store/useShopperStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useCartStore } from "@/store/useCartStore";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { StorefrontFooter } from "@/components/storefront/StorefrontFooter";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { CheckoutDrawer } from "@/components/storefront/CheckoutDrawer";
import { ProductCard } from "@/components/storefront/ProductCard";
import { StoreData, StoreProduct } from "@/types/storefront";
import {
  ArrowLeft,
  User,
  ShoppingBag,
  Heart,
  LogOut,
  ChevronRight,
  Loader2,
  X,
} from "lucide-react";

const NIGERIAN_STATES = [
  "Lagos",
  "Abuja FCT",
  "Rivers",
  "Oyo",
  "Ogun",
  "Kano",
  "Enugu",
  "Edo",
  "Delta",
  "Kaduna",
  "Anambra",
  "Cross River",
  "Akwa Ibom",
  "Abia",
  "Adamawa",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Ebonyi",
  "Ekiti",
  "Gombe",
  "Imo",
  "Jigawa",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Nasarawa",
  "Niger",
  "Ondo",
  "Osun",
  "Plateau",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

type Tab = "menu" | "profile" | "orders" | "wishlist";

export function AccountClient({ store }: { store: StoreData }) {
  const router = useRouter();
  const { addItem } = useCartStore();
  const {
    token,
    customer,
    storeSlug: loadedSlug,
    loadShopper,
    updateShopperProfile,
    logoutShopper,
  } = useShopperStore();
  const {
    items: wishlistItems,
    storeSlug: wishlistSlug,
    loadWishlist,
  } = useWishlistStore();

  const [tab, setTab] = useState<Tab>("menu");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Address modal (NO email confirmation required)
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addrInput, setAddrInput] = useState("");
  const [stateInput, setStateInput] = useState("Lagos");
  const [cityInput, setCityInput] = useState("");
  const [savingAddr, setSavingAddr] = useState(false);

  // Profile Edit modal (Name, Email, or Password -> REQUIRES 6-digit email confirmation)
  const [editField, setEditField] = useState<"name" | "email" | "password" | null>(
    null
  );
  const [editValue, setEditValue] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (loadedSlug !== store.slug) {
      loadShopper(store.slug);
      return;
    }
    if (!token) {
      router.replace(`/${store.slug}/account/login`);
      return;
    }

    const fetchMe = async () => {
      try {
        const res = await api.get("/shopper/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const me = res.data.data;
        updateShopperProfile(store.slug, me);
        setOrders(me.orders || []);
      } catch {
        logoutShopper(store.slug);
        router.replace(`/${store.slug}/account/login`);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [
    store.slug,
    loadedSlug,
    token,
    loadShopper,
    router,
    updateShopperProfile,
    logoutShopper,
  ]);

  useEffect(() => {
    if (wishlistSlug !== store.slug) {
      loadWishlist(store.slug);
    }
  }, [store.slug, wishlistSlug, loadWishlist]);

  const openAddressModal = () => {
    setAddrInput(customer?.address || "");
    setStateInput(customer?.state || "Lagos");
    setCityInput(customer?.city || "");
    setAddressModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingAddr(true);
    try {
      const res = await api.put(
        "/shopper/address",
        {
          address: addrInput.trim(),
          state: stateInput,
          city: cityInput.trim() || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateShopperProfile(store.slug, res.data.data);
      setAddressModalOpen(false);
      toast.success("Delivery address updated!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update address.");
    } finally {
      setSavingAddr(false);
    }
  };

  const openSensitiveEdit = (field: "name" | "email" | "password") => {
    setEditField(field);
    setEditValue(
      field === "name"
        ? customer?.fullName || ""
        : field === "email"
        ? customer?.email || ""
        : ""
    );
    setOtpSent(false);
    setOtpCode("");
  };

  const handleSendProfileOtp = async () => {
    if (!token) return;
    setSendingOtp(true);
    try {
      await api.post(
        "/shopper/profile-otp",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOtpSent(true);
      toast.success("6-digit confirmation code sent to your email!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not send code.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSaveProfileField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editField) return;
    setSavingProfile(true);
    try {
      const payload: any = { code: otpCode.trim() };
      if (editField === "name") payload.fullName = editValue.trim();
      if (editField === "email") payload.email = editValue.trim();
      if (editField === "password") payload.newPassword = editValue;

      const res = await api.put("/shopper/profile", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      updateShopperProfile(store.slug, res.data.data);
      setEditField(null);
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Invalid or expired confirmation code."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleQuickAddWishlist = (p: StoreProduct, e: React.MouseEvent) => {
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

  if (loading || !customer) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#2e1065]" />
      </div>
    );
  }

  const firstName = customer.fullName.split(" ")[0] || customer.fullName;
  const memberSince = customer.createdAt
    ? new Date(customer.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#20231e] font-sans flex flex-col">
      <StorefrontHeader store={store} />

      <main className="flex-1 mx-auto w-[min(760px,calc(100%-32px))] py-8 sm:py-12">
        {/* MENU TAB */}
        {tab === "menu" && (
          <div className="space-y-6">
            <Link
              href={`/${store.slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#20231e] hover:text-[#2e1065]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Store</span>
            </Link>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0f172a] tracking-tight">
              Account Settings
            </h1>

            <div className="bg-white border border-[#e6e8e1] rounded-2xl divide-y divide-[#f1f5f9] overflow-hidden">
              <button
                type="button"
                onClick={() => setTab("profile")}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#fafaf8] transition cursor-pointer"
              >
                <span className="flex items-center gap-3 text-sm font-semibold text-[#0f172a]">
                  <User className="w-4 h-4 text-[#64748b]" />
                  <span>My Profile</span>
                </span>
                <ChevronRight className="w-4 h-4 text-[#94a3b8]" />
              </button>

              <button
                type="button"
                onClick={() => setTab("orders")}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#fafaf8] transition cursor-pointer"
              >
                <span className="flex items-center gap-3 text-sm font-semibold text-[#0f172a]">
                  <ShoppingBag className="w-4 h-4 text-[#64748b]" />
                  <span>My Orders ({orders.length})</span>
                </span>
                <ChevronRight className="w-4 h-4 text-[#94a3b8]" />
              </button>

              <button
                type="button"
                onClick={() => setTab("wishlist")}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#fafaf8] transition cursor-pointer"
              >
                <span className="flex items-center gap-3 text-sm font-semibold text-[#0f172a]">
                  <Heart className="w-4 h-4 text-[#64748b]" />
                  <span>Wishlist ({wishlistItems.length})</span>
                </span>
                <ChevronRight className="w-4 h-4 text-[#94a3b8]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  logoutShopper(store.slug);
                  router.push(`/${store.slug}`);
                }}
                className="w-full px-5 py-4 flex items-center gap-3 text-sm font-semibold text-red-600 hover:bg-red-50/50 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* MY PROFILE TAB */}
        {tab === "profile" && (
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => setTab("menu")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#20231e] hover:text-[#2e1065] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Account Settings</span>
            </button>

            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0f172a] tracking-tight">
                Hello, {firstName} — Welcome to {store.name}
              </h1>
              {memberSince && (
                <p className="text-xs text-[#64748b] mt-1">
                  Member since {memberSince}
                </p>
              )}
            </div>

            {/* My Profile Details Card */}
            <div className="bg-white border border-[#e6e8e1] rounded-2xl p-5 sm:p-6 space-y-5">
              <h2 className="font-display text-base font-bold text-[#0f172a]">
                My Profile
              </h2>

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-[#64748b]">Name</p>
                    <p className="text-sm font-semibold text-[#0f172a] mt-0.5">
                      {customer.fullName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openSensitiveEdit("name")}
                    className="text-xs font-bold text-[#0f172a] hover:text-[#2e1065] cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-[#64748b]">Email</p>
                    <p className="text-sm font-semibold text-[#0f172a] underline mt-0.5">
                      {customer.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openSensitiveEdit("email")}
                    className="text-xs font-bold text-[#0f172a] hover:text-[#2e1065] cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-[#64748b]">Password</p>
                    <p className="text-sm font-bold tracking-widest text-[#0f172a] mt-0.5">
                      ••••••••••••
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openSensitiveEdit("password")}
                    className="text-xs font-bold text-[#0f172a] hover:text-[#2e1065] cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>

            {/* Delivery Address Card (No email confirmation required) */}
            <div className="bg-white border border-[#e6e8e1] rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-base font-bold text-[#0f172a]">
                  Delivery Address
                </h2>
                <button
                  type="button"
                  onClick={openAddressModal}
                  className="text-xs font-bold text-[#0f172a] hover:text-[#2e1065] cursor-pointer"
                >
                  {customer.address ? "Edit" : "+ Add address"}
                </button>
              </div>

              {customer.address ? (
                <div className="space-y-1 text-xs text-[#64748b]">
                  <p className="text-[11px] uppercase tracking-wider font-semibold">
                    Primary Shipping Destination
                  </p>
                  <p className="text-sm font-semibold text-[#0f172a]">
                    {customer.address}
                  </p>
                  <p>
                    {[customer.city, customer.state, "Nigeria"]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p>Contact: {customer.phoneNumber}</p>
                </div>
              ) : (
                <p className="text-xs text-[#64748b]">
                  No delivery address saved yet. Add one here to auto-fill checkout.
                </p>
              )}
            </div>
          </div>
        )}

        {/* MY ORDERS TAB */}
        {tab === "orders" && (
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => setTab("menu")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#20231e] hover:text-[#2e1065] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Account Settings</span>
            </button>

            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0f172a] tracking-tight">
                My Orders
              </h1>
              <p className="text-xs sm:text-sm text-[#64748b] mt-1">
                Track delivery status, review previous purchases, and view receipts.
              </p>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white border border-[#e6e8e1] rounded-2xl p-10 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#f3f4ef] text-[#64748b] flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-display text-base font-bold text-[#0f172a]">
                    No orders yet
                  </p>
                  <p className="text-xs text-[#64748b] mt-1">
                    Explore {store.name} and place your first order today.
                  </p>
                </div>
                <Link
                  href={`/${store.slug}/products`}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-[8px] bg-[#2e1065] text-white text-xs font-bold"
                >
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((ord) => (
                  <Link
                    key={ord.id}
                    href={getStorePath(store.slug, `/orders/${ord.orderNumber}`)}
                    className="block bg-white border border-[#e6e8e1] hover:border-[#2e1065] rounded-2xl p-4 sm:p-5 transition space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#2e1065]">
                        #{ord.orderNumber}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#f3f4ef] text-[#20231e]">
                        {ord.orderStatus}
                      </span>
                    </div>

                    <div className="space-y-2 divide-y divide-[#f3f4ef]">
                      {ord.items?.map((i: any, idx: number) => {
                        const thumb = i.product?.images?.[0];
                        return (
                          <div
                            key={i.id || idx}
                            className="pt-2 first:pt-0 flex items-center gap-3 text-xs"
                          >
                            <div className="h-11 w-11 rounded-lg bg-[#fafaf8] border border-[#e6e8e1] overflow-hidden shrink-0 flex items-center justify-center">
                              {thumb ? (
                                <img
                                  src={getImageUrl(thumb)}
                                  alt={i.productTitle}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <ShoppingBag className="w-4 h-4 text-[#c5c8be]" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-[#0f172a] truncate">
                                {i.productTitle}
                              </p>
                              <p className="text-[11px] text-[#64748b]">
                                Qty: {i.quantity}
                                {i.variantName ? ` • ${i.variantName}` : ""}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-[#f3f4ef]">
                      <span className="font-bold text-[#0f172a]">
                        {formatCurrency(ord.totalAmount)}
                      </span>
                      <span className="font-semibold text-[#2e1065] underline">
                        View Receipt →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WISHLIST TAB */}
        {tab === "wishlist" && (
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => setTab("menu")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#20231e] hover:text-[#2e1065] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Account Settings</span>
            </button>

            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0f172a] tracking-tight">
                Wishlist
              </h1>
              <p className="text-xs sm:text-sm text-[#64748b] mt-1">
                Saved items from {store.name} you want to buy later.
              </p>
            </div>

            {wishlistItems.length === 0 ? (
              <div className="bg-white border border-[#e6e8e1] rounded-2xl p-10 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#f3f4ef] text-[#64748b] flex items-center justify-center mx-auto">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-display text-base font-bold text-[#0f172a]">
                    Your wishlist is empty
                  </p>
                  <p className="text-xs text-[#64748b] mt-1">
                    Tap the heart icon on any product while browsing to save it here.
                  </p>
                </div>
                <Link
                  href={`/${store.slug}/products`}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-[8px] bg-[#2e1065] text-white text-xs font-bold"
                >
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {wishlistItems.map((item) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    store={store}
                    onAddToCart={handleQuickAddWishlist}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <StorefrontFooter store={store} />

      {/* Address Modal */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#0f172a]">
                Delivery Address
              </h3>
              <button
                type="button"
                onClick={() => setAddressModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveAddress} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={addrInput}
                  onChange={(e) => setAddrInput(e.target.value)}
                  placeholder="39, Onitire Avenue..."
                  className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                    State *
                  </label>
                  <select
                    value={stateInput}
                    onChange={(e) => setStateInput(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm bg-white"
                  >
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                    City / Town
                  </label>
                  <input
                    type="text"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    placeholder="Lekki"
                    className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={savingAddr}
                className="w-full h-10 rounded-lg bg-[#2e1065] text-white text-xs font-bold cursor-pointer"
              >
                {savingAddr ? "Saving..." : "Save Delivery Address"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sensitive Profile Edit Modal (Name / Email / Password -> Email Confirmation Required) */}
      {editField && (
        <div className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#0f172a] capitalize">
                Update {editField}
              </h3>
              <button
                type="button"
                onClick={() => setEditField(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#64748b]">
              For your security, please confirm this change with a 6-digit code sent to{" "}
              <strong className="text-[#0f172a]">{customer.email}</strong>.
            </p>
            <form onSubmit={handleSaveProfileField} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1 capitalize">
                  New {editField} *
                </label>
                <input
                  type={
                    editField === "password"
                      ? "password"
                      : editField === "email"
                      ? "email"
                      : "text"
                  }
                  required
                  minLength={editField === "password" ? 6 : 2}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm"
                />
              </div>

              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendProfileOtp}
                  disabled={sendingOtp}
                  className="w-full h-10 rounded-lg bg-[#2e1065] text-white text-xs font-bold cursor-pointer"
                >
                  {sendingOtp ? "Sending code..." : "Send 6-Digit Email Code"}
                </button>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                      6-Digit Confirmation Code *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) =>
                        setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="000000"
                      className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-center font-mono font-bold tracking-[0.25em]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingProfile || otpCode.length !== 6}
                    className="w-full h-10 rounded-lg bg-[#2e1065] disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                  >
                    {savingProfile ? "Updating..." : "Confirm & Save"}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}

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
