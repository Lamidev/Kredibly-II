"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  formatCurrency,
  formatWhatsAppNumber,
  getImageUrl,
} from "@/lib/utils";
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  MessageCircle,
  MapPin,
  Phone,
  Mail,
  User,
  Loader2,
  RefreshCw,
  Search,
  TrendingUp,
  ShoppingBag,
  ArrowLeft,
  RotateCcw,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface OrderItem {
  id: string;
  productTitle: string;
  variantName?: string | null;
  unitPrice: number | string;
  quantity: number;
  subtotal: number | string;
  product?: {
    images?: string[];
    slug?: string;
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
    email?: string | null;
    address: string;
    state: string;
    city?: string | null;
  };
  items: OrderItem[];
}

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [pendingOrderAction, setPendingOrderAction] = useState<{
    orderId: string;
    status: string;
    title: string;
    description: string;
    confirmLabel: string;
    variant: "danger" | "default";
    icon: "warning" | "reset";
  } | null>(null);

  const fetchOrders = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await api.get("/orders");
      const list: Order[] = res.data.data || [];
      setOrders(list);
      const orderParam =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("order")
          : null;
      if (selectedOrder) {
        const updated = list.find((o) => o.id === selectedOrder.id) || null;
        setSelectedOrder(updated);
      } else if (orderParam) {
        const matched = list.find(
          (o) => o.orderNumber.toLowerCase() === orderParam.toLowerCase()
        );
        if (matched) setSelectedOrder(matched);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push("/login");
      } else {
        toast.error("Failed to load orders.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setActionLoadingId(orderId);
    const labelMap: Record<string, string> = {
      PAID: "Confirmed",
      SHIPPED: "Dispatched",
      DELIVERED: "Delivered",
      CANCELLED: "Cancelled",
    };
    try {
      const res = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      const updatedOrder: Order | undefined = res.data?.data;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? (updatedOrder ? { ...o, ...updatedOrder } : { ...o, orderStatus: newStatus }) : o
        )
      );
      setSelectedOrder((prev) =>
        prev && prev.id === orderId
          ? updatedOrder
            ? { ...prev, ...updatedOrder }
            : { ...prev, orderStatus: newStatus }
          : prev
      );
      toast.success(`Order status updated to ${labelMap[newStatus] || newStatus}.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update order status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === "PAID")
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const confirmedCount = orders.filter(
    (o) => o.orderStatus === "PAID" || o.orderStatus === "PROCESSING"
  ).length;
  const shippedCount = orders.filter((o) => o.orderStatus === "SHIPPED").length;
  const deliveredCount = orders.filter((o) => o.orderStatus === "DELIVERED").length;
  const cancelledCount = orders.filter((o) => o.orderStatus === "CANCELLED").length;

  const filteredOrders = orders.filter((o) => {
    if (activeTab === "CONFIRMED") {
      if (o.orderStatus !== "PAID" && o.orderStatus !== "PROCESSING") return false;
    } else if (activeTab !== "ALL" && o.orderStatus !== activeTab) {
      return false;
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customer.fullName.toLowerCase().includes(q) ||
      o.customer.phoneNumber.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 text-[#2e1065]" /> Confirmed
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
            <Truck className="w-3 h-3" /> Shipped
          </Badge>
        );
      case "DELIVERED":
        return (
          <Badge variant="success">
            <CheckCircle2 className="w-3 h-3" /> Delivered
          </Badge>
        );
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getWhatsAppLink = (order: Order) => {
    const intl = formatWhatsAppNumber(order.customer.phoneNumber);
    const msg = encodeURIComponent(
      `Hi ${order.customer.fullName}! Thank you for your order #${order.orderNumber}. I'm following up regarding your delivery!`
    );
    return `https://wa.me/${intl}?text=${msg}`;
  };

  if (selectedOrder) {
    const flow = [
      { id: "PAID", label: "Confirmed" },
      { id: "SHIPPED", label: "Dispatched" },
      { id: "DELIVERED", label: "Delivered" },
    ] as const;

    const currentIdx = Math.max(
      0,
      flow.findIndex((s) => s.id === selectedOrder.orderStatus)
    );
    const nextStage =
      currentIdx < flow.length - 1 ? flow[currentIdx + 1] : null;
    const prevStage = currentIdx > 0 ? flow[currentIdx - 1] : null;

    return (
      <div className="space-y-6 max-w-4xl">
        <button
          type="button"
          onClick={() => setSelectedOrder(null)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#2e1065] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Orders</span>
        </button>

        {/* Order Top Header Card */}
        <Card>
          <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-mono text-xl sm:text-2xl font-extrabold text-[#0f172a]">
                  Order #{selectedOrder.orderNumber}
                </h1>
                {getStatusBadge(selectedOrder.orderStatus)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Placed on{" "}
                {new Date(selectedOrder.createdAt).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Fulfillment Status Timeline (Matching Reference UI, No Logistics) */}
        <Card>
          <CardContent className="p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-[#0f172a]">
                  Fulfillment Status
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update this order&apos;s delivery progress and notify the buyer.
                </p>
              </div>

              {selectedOrder.orderStatus !== "CANCELLED" && (
                <div className="flex items-center gap-2 shrink-0">
                  {selectedOrder.orderStatus !== "DELIVERED" && (
                    <button
                      type="button"
                      disabled={actionLoadingId === selectedOrder.id}
                      onClick={() =>
                        setPendingOrderAction({
                          orderId: selectedOrder.id,
                          status: "CANCELLED",
                          title: "Cancel Order",
                          description:
                            "Cancel this order? This restores item stock and notifies the buyer by email. Handle any refund directly with the buyer.",
                          confirmLabel: "Cancel Order",
                          variant: "danger",
                          icon: "warning",
                        })
                      }
                      className="px-3 py-1.5 rounded-full border border-red-200 bg-red-50/60 hover:bg-red-50 text-red-600 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Cancel Order</span>
                    </button>
                  )}

                  {prevStage && (
                    <button
                      type="button"
                      disabled={actionLoadingId === selectedOrder.id}
                      onClick={() =>
                        setPendingOrderAction({
                          orderId: selectedOrder.id,
                          status: prevStage.id,
                          title: "Reset Fulfillment Status",
                          description: `Reset this order's status back to "${prevStage.label}"?`,
                          confirmLabel: "Reset Status",
                          variant: "default",
                          icon: "reset",
                        })
                      }
                      className="px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Status</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {selectedOrder.orderStatus === "CANCELLED" ? (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs font-semibold text-red-700">
                  This order has been cancelled and item stock was restored.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={actionLoadingId === selectedOrder.id}
                  onClick={() => handleStatusUpdate(selectedOrder.id, "PAID")}
                >
                  Restore to Confirmed
                </Button>
              </div>
            ) : (
              <>
                {/* 3-Step Connected Circular Timeline */}
                <div className="relative flex items-start justify-between pt-1 pb-2 px-2 sm:px-6">
                  {/* Connecting Background Line */}
                  <div className="absolute top-[19px] left-10 right-10 sm:left-16 sm:right-16 h-[2px] bg-slate-200 z-0" />
                  {/* Active Progress Fill */}
                  <div
                    className="absolute top-[19px] left-10 sm:left-16 h-[2px] bg-[#2e1065] z-0 transition-all duration-300"
                    style={{
                      width:
                        currentIdx === 0
                          ? "0%"
                          : currentIdx === 1
                          ? "42%"
                          : "calc(100% - 80px)",
                    }}
                  />

                  {flow.map((st, idx) => {
                    const isCompleted =
                      idx < currentIdx ||
                      (idx === flow.length - 1 &&
                        selectedOrder.orderStatus === "DELIVERED");
                    const isCurrent =
                      idx === currentIdx &&
                      selectedOrder.orderStatus !== "DELIVERED";

                    return (
                      <div
                        key={st.id}
                        className="relative z-10 flex flex-col items-center text-center gap-2 min-w-[76px]"
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isCompleted
                              ? "bg-[#2e1065] text-white shadow-xs"
                              : isCurrent
                              ? "bg-amber-500 text-white ring-4 ring-amber-100"
                              : "bg-slate-100 text-slate-400 border border-slate-200"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <span
                          className={`text-xs font-semibold ${
                            isCompleted || isCurrent
                              ? "text-[#0f172a]"
                              : "text-slate-400"
                          }`}
                        >
                          {st.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Full-width Primary Action CTA */}
                {nextStage ? (
                  <button
                    type="button"
                    disabled={actionLoadingId === selectedOrder.id}
                    onClick={() =>
                      handleStatusUpdate(selectedOrder.id, nextStage.id)
                    }
                    className="w-full h-11 rounded-xl bg-[#2e1065] hover:bg-[#3b0764] disabled:opacity-50 text-white font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                  >
                    {actionLoadingId === selectedOrder.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>
                          Advance Status to &ldquo;{nextStage.label}&rdquo;
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                ) : (
                  <div className="w-full py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Order Delivered &amp; Completed</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Items Ordered FIRST (with Product Images) */}
        <Card>
          <CardContent className="p-5 sm:p-6 space-y-4">
            <p className="font-bold uppercase tracking-wider text-slate-400 text-[10.5px]">
              Items Ordered ({selectedOrder.items.length})
            </p>
            <div className="divide-y divide-slate-100">
              {selectedOrder.items.map((item) => {
                const thumb = item.product?.images?.[0];
                return (
                  <div
                    key={item.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {thumb ? (
                          <img
                            src={getImageUrl(thumb)}
                            alt={item.productTitle}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[#0f172a] text-sm truncate">
                          {item.productTitle}
                        </p>
                        {item.variantName && (
                          <p className="text-slate-500">{item.variantName}</p>
                        )}
                        <p className="text-slate-500 mt-0.5">
                          Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-[#0f172a] text-sm shrink-0">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between font-bold">
              <span className="text-slate-500 text-xs sm:text-sm">Total Paid</span>
              <span className="font-display text-lg text-[#2e1065]">
                {formatCurrency(selectedOrder.totalAmount)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Customer & Delivery Destination BELOW Items Ordered (with Contact Actions at bottom) */}
        <Card>
          <CardContent className="p-5 sm:p-6 space-y-4 text-xs">
            <p className="font-bold uppercase tracking-wider text-slate-400 text-[10.5px]">
              Customer &amp; Delivery Destination
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-[#2e1065] shrink-0" />
                <span className="font-bold text-[#0f172a] text-sm">
                  {selectedOrder.customer.fullName}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#2e1065] shrink-0" />
                <span className="font-mono text-[#0f172a]">
                  {selectedOrder.customer.phoneNumber}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#2e1065] shrink-0 mt-0.5" />
                <span className="text-[#0f172a]">
                  {selectedOrder.customer.address},{" "}
                  {selectedOrder.customer.city
                    ? `${selectedOrder.customer.city}, `
                    : ""}
                  {selectedOrder.customer.state}
                </span>
              </div>
            </div>

            {/* Contact Actions (WhatsApp + Call + Email fallback) */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
              <a
                href={getWhatsAppLink(selectedOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[140px]"
              >
                <Button type="button" variant="outline" size="sm" className="w-full">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp</span>
                </Button>
              </a>
              <a
                href={`tel:${selectedOrder.customer.phoneNumber}`}
                className="flex-1 min-w-[100px]"
              >
                <Button type="button" variant="outline" size="sm" className="w-full">
                  <Phone className="w-4 h-4 text-[#2e1065]" />
                  <span>Call</span>
                </Button>
              </a>
              {selectedOrder.customer.email && (
                <a
                  href={`mailto:${selectedOrder.customer.email}`}
                  className="flex-1 min-w-[100px]"
                >
                  <Button type="button" variant="outline" size="sm" className="w-full">
                    <Mail className="w-4 h-4 text-[#2e1065]" />
                    <span>Email</span>
                  </Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        <ConfirmDialog
          open={Boolean(pendingOrderAction)}
          onClose={() => !actionLoadingId && setPendingOrderAction(null)}
          onConfirm={async () => {
            if (!pendingOrderAction) return;
            await handleStatusUpdate(
              pendingOrderAction.orderId,
              pendingOrderAction.status
            );
            setPendingOrderAction(null);
          }}
          title={pendingOrderAction?.title || "Confirm Action"}
          description={pendingOrderAction?.description || ""}
          confirmLabel={
            actionLoadingId ? "Updating..." : pendingOrderAction?.confirmLabel || "Confirm"
          }
          variant={pendingOrderAction?.variant || "default"}
          icon={pendingOrderAction?.icon || "warning"}
          loading={Boolean(actionLoadingId)}
        />
      </div>
    );
  }

  const tabs = [
    { id: "ALL", label: `All (${orders.length})` },
    { id: "CONFIRMED", label: `Confirmed (${confirmedCount})` },
    { id: "SHIPPED", label: `Shipped (${shippedCount})` },
    { id: "DELIVERED", label: `Delivered (${deliveredCount})` },
    { id: "CANCELLED", label: `Cancelled (${cancelledCount})` },
  ];

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a] tracking-tight">
            Orders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track, fulfill, and manage direct customer purchases from your store.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          className="w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* 4 Minimalist KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                Total Revenue
              </span>
              <span className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/70 flex items-center justify-center text-[#2e1065]">
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="font-display text-2xl font-bold text-[#0f172a] truncate">
              {loading ? "—" : formatCurrency(totalRevenue)}
            </p>
            <p className="text-[11px] text-slate-500">Verified sales collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                Total Orders
              </span>
              <span className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/70 flex items-center justify-center text-[#0f172a]">
                <ShoppingBag className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="font-display text-2xl font-bold text-[#0f172a]">
              {loading ? "—" : orders.length}
            </p>
            <p className="text-[11px] text-slate-500">All lifetime orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                Confirmed
              </span>
              <span className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/70 flex items-center justify-center text-[#0f172a]">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="font-display text-2xl font-bold text-[#0f172a]">
              {loading ? "—" : confirmedCount}
            </p>
            <p className="text-[11px] text-slate-500">Paid &amp; ready to pack</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                Delivered
              </span>
              <span className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/70 flex items-center justify-center text-[#0f172a]">
                <Truck className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="font-display text-2xl font-bold text-[#0f172a]">
              {loading ? "—" : deliveredCount}
            </p>
            <p className="text-[11px] text-slate-500">Fulfilled &amp; completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Search + Orders Table Card */}
      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Status Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer border ${
                  activeTab === tab.id
                    ? "bg-[#2e1065] text-white border-[#2e1065]"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-[#0f172a]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by order ID, customer name, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-sm text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:border-[#2e1065]"
            />
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#2e1065]" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 px-4 text-center space-y-2 border-t border-slate-100">
              <Package className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-[#0f172a]">
                No orders found
              </p>
              <p className="text-xs text-slate-500">
                Try adjusting your filters or search terms.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                {filteredOrders
                  .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                  .map((order) => {
                    const firstThumb = order.items?.[0]?.product?.images?.[0];
                    const extraCount = (order.items?.length || 0) - 1;
                    return (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="w-full text-left p-3.5 hover:bg-slate-50/80 active:bg-slate-100/80 transition flex items-start gap-3"
                      >
                        <div className="relative h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center mt-0.5">
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
                            <span className="absolute bottom-0 right-0 px-1 rounded-tl bg-[#2e1065] text-white text-[9px] font-bold">
                              +{extraCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-bold text-[#0f172a] truncate">
                              #{order.orderNumber}
                            </span>
                            <span className="font-mono text-xs font-bold text-[#0f172a] shrink-0">
                              {formatCurrency(order.totalAmount)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-700 truncate">
                              {order.customer.fullName}
                            </p>
                            <div className="shrink-0">{getStatusBadge(order.orderStatus)}</div>
                          </div>
                          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                            <span className="font-mono truncate">{order.customer.phoneNumber}</span>
                            <span className="shrink-0">
                              {new Date(order.createdAt).toLocaleDateString("en-NG", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50/70">
                      <th className="py-3 px-4 font-semibold">Order ID</th>
                      <th className="py-3 px-4 font-semibold hidden sm:table-cell">
                        Date
                      </th>
                      <th className="py-3 px-4 font-semibold">Customer</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders
                      .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                      .map((order) => {
                      const firstThumb = order.items?.[0]?.product?.images?.[0];
                      const extraCount = (order.items?.length || 0) - 1;
                      return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className="hover:bg-slate-50/80 transition cursor-pointer"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0f172a] whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="relative h-9 w-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
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
                                <span className="absolute bottom-0 right-0 px-1 rounded-tl bg-[#2e1065] text-white text-[9px] font-bold">
                                  +{extraCount}
                                </span>
                              )}
                            </div>
                            <span>#{order.orderNumber}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 hidden sm:table-cell whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-[#0f172a]">
                            {order.customer.fullName}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {order.customer.phoneNumber}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getStatusBadge(order.orderStatus)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0f172a] whitespace-nowrap">
                          {formatCurrency(order.totalAmount)}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <Pagination
            currentPage={currentPage}
            totalItems={filteredOrders.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
