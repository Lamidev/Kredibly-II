"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import {
  playSaleChime,
  setSaleAlertsEnabled,
  subscribeMerchantPush,
} from "@/lib/notifications";
import { toast } from "sonner";
import {
  Package,
  TrendingUp,
  BadgeCheck,
  Users,
  ArrowRight,
  ChevronRight,
  Clock,
  Truck,
  CheckCircle2,
  Loader2,
  X,
  Bell,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface OrderItem {
  id: string;
  productTitle: string;
  quantity: number;
  product?: {
    images?: string[];
  } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number | string;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  customer: {
    fullName: string;
    phoneNumber: string;
  };
  items: OrderItem[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, store } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [hasBankAccount, setHasBankAccount] = useState(false);
  const [isKycVerified, setIsKycVerified] = useState(false);
  const [storeDetails, setStoreDetails] = useState<any>(null);
  const [checklistDismissed, setChecklistDismissed] = useState(false);
  const [pushPromptMode, setPushPromptMode] = useState<
    "hidden" | "enable" | "ios_pwa"
  >("hidden");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("kredibly_push_banner_dismissed") === "1") return;
    const ua = window.navigator.userAgent || "";
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isIos && !isStandalone) {
      setPushPromptMode("ios_pwa");
      return;
    }

    if ("Notification" in window && Notification.permission === "default") {
      setPushPromptMode("enable");
    }
  }, []);

  const handleEnablePushBanner = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const ua = window.navigator.userAgent || "";
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isIos && !isStandalone) {
      toast.error(
        "On iPhone, open Kredibly from your Home Screen app icon to enable push notifications."
      );
      setPushPromptMode("ios_pwa");
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        setSaleAlertsEnabled(true);
        playSaleChime();
        await subscribeMerchantPush();
        toast.success("Phone push alerts & sale sound enabled!");
        setPushPromptMode("hidden");
      } else if (perm === "denied") {
        toast.error(
          isIos
            ? "Notifications blocked in iPhone Settings. Go to Settings > Notifications > Kredibly to allow them."
            : "Notifications blocked in browser settings."
        );
        setPushPromptMode("hidden");
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const [prodRes, ordRes, custRes, settingsRes, walletRes] =
          await Promise.allSettled([
            api.get("/products"),
            api.get("/orders"),
            api.get("/customers"),
            api.get("/store/settings"),
            api.get("/wallet"),
          ]);

        if (prodRes.status === "fulfilled") {
          setTotalProducts(prodRes.value.data?.data?.length || 0);
        }
        if (ordRes.status === "fulfilled") {
          const allOrders: Order[] = ordRes.value.data?.data || [];
          setOrders(allOrders.filter((o) => o.paymentStatus === "PAID"));
        }
        if (custRes.status === "fulfilled") {
          setTotalCustomers(custRes.value.data?.data?.length || 0);
        }
        if (settingsRes.status === "fulfilled") {
          setStoreDetails(settingsRes.value.data?.data || null);
        }
        if (walletRes.status === "fulfilled") {
          const bank = walletRes.value.data?.data?.bank;
          setHasBankAccount(Boolean(bank?.bankName && bank?.accountNumber));
          setIsKycVerified(walletRes.value.data?.data?.kyc?.status === "VERIFIED");
        }
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === "PAID")
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <Badge variant="warning">
            <Clock className="w-3 h-3" /> Paid
          </Badge>
        );
      case "PROCESSING":
        return (
          <Badge variant="secondary">
            <Package className="w-3 h-3" /> Processing
          </Badge>
        );
      case "SHIPPED":
        return (
          <Badge variant="default">
            <Truck className="w-3 h-3" /> Dispatched
          </Badge>
        );
      case "DELIVERED":
        return (
          <Badge variant="success">
            <CheckCircle2 className="w-3 h-3" /> Delivered
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const activeStore = storeDetails || store;
  const setupSteps = [
    {
      id: "brand",
      label: "Brand & Hero Banner",
      desc: "Add your store logo, hero cover photo, and store bio.",
      done: Boolean(
        activeStore?.logoUrl &&
          activeStore?.bannerUrl &&
          activeStore?.description
      ),
      href: "/dashboard/settings",
    },
    {
      id: "footer",
      label: "Footer & Social Contact",
      desc: "Add support email, store address, and Instagram/TikTok links.",
      done: Boolean(
        activeStore?.contactEmail ||
          activeStore?.address ||
          activeStore?.socialLinks?.instagram ||
          activeStore?.socialLinks?.tiktok
      ),
      href: "/dashboard/settings",
    },
    {
      id: "offer",
      label: "Exclusive Offer & Delivery",
      desc: "Set your top storefront offer banner and state delivery fees.",
      done: Boolean(
        activeStore?.shippingConfig?.offerBannerEnabled ||
          Number(activeStore?.shippingConfig?.defaultFee || 0) > 0 ||
          activeStore?.shippingConfig?.freeDeliveryEnabled
      ),
      href: "/dashboard/delivery",
    },
    {
      id: "product",
      label: "Add Your First Product",
      desc: "Upload product photos, set prices, and publish to your store.",
      done: totalProducts > 0,
      href: "/dashboard/products",
    },
    {
      id: "google",
      label: "Show My Business on Google",
      desc: "Add logo, bio, address, 1+ social link & 3 products so buyers find you on Google.",
      done: Boolean(
        activeStore?.allowSearchIndexing !== false &&
          activeStore?.logoUrl &&
          (activeStore?.description || activeStore?.aboutText) &&
          activeStore?.address &&
          (activeStore?.socialLinks?.instagram ||
            activeStore?.socialLinks?.tiktok ||
            activeStore?.socialLinks?.facebook ||
            activeStore?.socialLinks?.twitter) &&
          totalProducts >= 3
      ),
      href: "/dashboard/settings#google-visibility",
    },
    {
      id: "bank",
      label: "Link Payout Bank Account",
      desc: "Verify your Nigerian bank account so you can receive payouts.",
      done: hasBankAccount,
      href: "/dashboard/wallet",
    },
  ];
  const completedSetupCount = setupSteps.filter((s) => s.done).length;
  const showSetupChecklist =
    !loading && !checklistDismissed && completedSetupCount < setupSteps.length;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
          Welcome back, {user?.fullName?.split(" ")[0] || "Merchant"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Track your store performance, inventory, and incoming orders.
        </p>
      </div>

      {/* Push Notification Activation Banner (shown only until granted or dismissed) */}
      {pushPromptMode !== "hidden" && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-[#2e1065]/20 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#2e1065]/10 text-[#2e1065] flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="text-xs">
              {pushPromptMode === "ios_pwa" ? (
                <>
                  <p className="font-bold text-[#0f172a]">
                    Get instant order alerts on iPhone
                  </p>
                  <p className="text-slate-500">
                    Tap <strong>Share → Add to Home Screen</strong>, open Kredibly from your home screen, then tap the Bell icon above.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold text-[#0f172a]">
                    Turn on instant order alerts on your phone
                  </p>
                  <p className="text-slate-500">
                    Get notified the second a buyer pays—even when the dashboard is closed.
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {pushPromptMode === "enable" && (
              <Button
                type="button"
                size="sm"
                onClick={handleEnablePushBanner}
                className="text-xs"
              >
                Enable Alerts
              </Button>
            )}
            <button
              type="button"
              onClick={() => {
                localStorage.setItem("kredibly_push_banner_dismissed", "1");
                setPushPromptMode("hidden");
              }}
              aria-label="Dismiss notification prompt"
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#0f172a] hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Guided Store Setup Checklist */}
      {showSetupChecklist && (
        <Card className="border-[#2e1065]/15 bg-gradient-to-r from-white via-white to-[#2e1065]/[0.03]">
          <CardHeader className="p-4 sm:p-5 pb-3 flex flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-sm sm:text-base">
                Complete Your Store Setup ({completedSetupCount} of{" "}
                {setupSteps.length})
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Finish these steps so your storefront looks complete from hero to footer.
              </CardDescription>
            </div>
            <button
              type="button"
              onClick={() => setChecklistDismissed(true)}
              aria-label="Dismiss setup checklist"
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#0f172a] hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 space-y-2">
            {setupSteps.map((step) => (
              <Link
                key={step.id}
                href={step.href}
                className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition ${
                  step.done
                    ? "bg-emerald-50/60 border-emerald-200/80 text-emerald-900"
                    : "bg-white border-slate-200 hover:border-[#2e1065]"
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <CheckCircle2
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      step.done ? "text-emerald-600" : "text-slate-300"
                    }`}
                  />
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-bold ${
                        step.done ? "line-through text-emerald-800" : "text-[#0f172a]"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {step.desc}
                    </p>
                  </div>
                </div>
                {!step.done && (
                  <span className="text-[11px] font-bold text-[#2e1065] shrink-0 inline-flex items-center gap-0.5">
                    Set up <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 4 Overview Metric Cards (4 in a row desktop, 2 in a row mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link href="/dashboard/wallet">
          <Card className="hover:border-[#2e1065]/30 transition-all h-full">
            <CardHeader className="p-4 sm:p-5 pb-2 flex flex-row items-center justify-between space-y-0">
              <CardDescription className="uppercase tracking-wider font-semibold text-[10px] sm:text-[11px]">
                Total Revenue
              </CardDescription>
              <TrendingUp className="w-4 h-4 text-[#2e1065] shrink-0" />
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0">
              <p className="text-xl sm:text-2xl font-extrabold text-[#0f172a] truncate">
                {loading ? "—" : formatCurrency(totalRevenue)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <span>Wallet &amp; payouts</span>
                <ArrowRight className="w-3 h-3" />
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/products">
          <Card className="hover:border-[#2e1065]/30 transition-all h-full">
            <CardHeader className="p-4 sm:p-5 pb-2 flex flex-row items-center justify-between space-y-0">
              <CardDescription className="uppercase tracking-wider font-semibold text-[10px] sm:text-[11px]">
                Total Products
              </CardDescription>
              <Package className="w-4 h-4 text-[#2e1065] shrink-0" />
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0">
              <p className="text-xl sm:text-2xl font-extrabold text-[#0f172a]">
                {loading ? "—" : totalProducts}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <span>Manage catalog</span>
                <ArrowRight className="w-3 h-3" />
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/orders">
          <Card className="hover:border-[#2e1065]/30 transition-all h-full">
            <CardHeader className="p-4 sm:p-5 pb-2 flex flex-row items-center justify-between space-y-0">
              <CardDescription className="uppercase tracking-wider font-semibold text-[10px] sm:text-[11px]">
                Total Orders
              </CardDescription>
              <BadgeCheck className="w-4 h-4 text-[#2e1065] shrink-0" />
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0">
              <p className="text-xl sm:text-2xl font-extrabold text-[#0f172a]">
                {loading ? "—" : orders.length}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <span>View orders</span>
                <ArrowRight className="w-3 h-3" />
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/customers">
          <Card className="hover:border-[#2e1065]/30 transition-all h-full">
            <CardHeader className="p-4 sm:p-5 pb-2 flex flex-row items-center justify-between space-y-0">
              <CardDescription className="uppercase tracking-wider font-semibold text-[10px] sm:text-[11px]">
                Total Customers
              </CardDescription>
              <Users className="w-4 h-4 text-[#2e1065] shrink-0" />
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0">
              <p className="text-xl sm:text-2xl font-extrabold text-[#0f172a]">
                {loading ? "—" : totalCustomers}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <span>Buyer records</span>
                <ArrowRight className="w-3 h-3" />
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Orders Below the 4 Metric Cards */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              Latest purchases placed on your store.
            </CardDescription>
          </div>
          <Link href="/dashboard/orders">
            <Button variant="outline" size="sm" className="text-xs">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[#2e1065]" />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2">
              <BadgeCheck className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-[#0f172a]">
                No orders yet
              </p>
              <p className="text-xs text-slate-500">
                Share your store link on WhatsApp and Instagram to start receiving orders.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-slate-100">
                {orders.slice(0, 8).map((order) => {
                  const firstThumb = order.items?.[0]?.product?.images?.[0];
                  const extraCount = (order.items?.length || 0) - 1;
                  return (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() =>
                        router.push(`/dashboard/orders?order=${order.orderNumber}`)
                      }
                      className="w-full text-left p-4 hover:bg-slate-50/90 active:bg-slate-100/80 transition flex items-center gap-3"
                    >
                      <div className="relative h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {firstThumb ? (
                          <img
                            src={getImageUrl(firstThumb)}
                            alt={order.orderNumber}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="w-4 h-4 text-slate-400" />
                        )}
                        {extraCount > 0 && (
                          <span className="absolute bottom-0 right-0 px-1 rounded-tl bg-[#2e1065] text-white text-[8.5px] font-bold">
                            +{extraCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-[#0f172a] truncate">
                            #{order.orderNumber}
                          </span>
                          <span className="font-mono text-xs font-bold text-[#2e1065] shrink-0">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <p className="text-xs font-medium text-slate-600 truncate">
                            {order.customer.fullName}
                          </p>
                          <div className="shrink-0">{getStatusBadge(order.orderStatus)}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/70">
                      <th className="py-3 px-4 font-semibold">Order</th>
                      <th className="py-3 px-4 font-semibold">Customer</th>
                      <th className="py-3 px-4 font-semibold hidden sm:table-cell">
                        Items
                      </th>
                      <th className="py-3 px-4 font-semibold">Amount</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.slice(0, 8).map((order) => {
                      const firstThumb = order.items?.[0]?.product?.images?.[0];
                      const extraCount = (order.items?.length || 0) - 1;
                      return (
                      <tr
                        key={order.id}
                        onClick={() =>
                          router.push(`/dashboard/orders?order=${order.orderNumber}`)
                        }
                        className="hover:bg-slate-50/90 transition cursor-pointer group"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0f172a] whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="relative h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {firstThumb ? (
                                <img
                                  src={getImageUrl(firstThumb)}
                                  alt={order.orderNumber}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Package className="w-3.5 h-3.5 text-slate-400" />
                              )}
                              {extraCount > 0 && (
                                <span className="absolute bottom-0 right-0 px-1 rounded-tl bg-[#2e1065] text-white text-[8.5px] font-bold">
                                  +{extraCount}
                                </span>
                              )}
                            </div>
                            <span className="group-hover:text-[#2e1065] group-hover:underline">
                              #{order.orderNumber}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-[#0f172a]">
                            {order.customer.fullName}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 hidden sm:table-cell max-w-[220px] truncate">
                          {order.items
                            .map((i) => `${i.quantity}x ${i.productTitle}`)
                            .join(", ")}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#2e1065] whitespace-nowrap">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center justify-between gap-2">
                            {getStatusBadge(order.orderStatus)}
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#2e1065] shrink-0" />
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
