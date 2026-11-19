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
  User,
  Loader2,
  RefreshCw,
  Search,
  TrendingUp,
  ShoppingBag,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";

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
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
      );
      setSelectedOrder((prev) =>
        prev && prev.id === orderId ? { ...prev, orderStatus: newStatus } : prev
      );
      toast.success(`Order status updated to ${newStatus}.`);
      await fetchOrders();
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
    const stages = [
      { id: "PAID", label: "Confirmed" },
      { id: "PROCESSING", label: "Processing" },
      { id: "SHIPPED", label: "Shipped" },
      { id: "DELIVERED", label: "Delivered" },
      { id: "CANCELLED", label: "Cancelled" },
    ] as const;

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
          <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

            <a
              href={getWhatsAppLink(selectedOrder)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto">
                <MessageCircle className="w-4 h-4 text-[#2e1065]" />
                <span>Chat Customer on WhatsApp</span>
              </Button>
            </a>
          </CardContent>
        </Card>

        {/* Visual Fulfillment Stepper */}
        <Card>
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Fulfillment Progress
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tap any stage below to update the buyer&apos;s live tracking status.
                </p>
              </div>
              {actionLoadingId === selectedOrder.id && (
                <Loader2 className="w-4 h-4 animate-spin text-[#2e1065]" />
              )}
            </div>

            {selectedOrder.orderStatus === "CANCELLED" ? (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs font-semibold text-red-700">
                  This order is marked as Cancelled.
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
              (() => {
                const flow = [
                  { id: "PAID", label: "Confirmed", sub: "Payment received" },
                  { id: "PROCESSING", label: "Packing", sub: "Preparing order" },
                  { id: "SHIPPED", label: "Dispatched", sub: "On the way" },
                  { id: "DELIVERED", label: "Delivered", sub: "Completed" },
                ] as const;
                const currentIdx = Math.max(
                  0,
                  flow.findIndex((s) => s.id === selectedOrder.orderStatus)
                );
                const nextStage =
                  currentIdx < flow.length - 1 ? flow[currentIdx + 1] : null;

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {flow.map((st, idx) => {
                        const isDone = idx < currentIdx;
                        const isCurrent = idx === currentIdx;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            disabled={
                              actionLoadingId === selectedOrder.id || isCurrent
                            }
                            onClick={() =>
                              handleStatusUpdate(selectedOrder.id, st.id)
                            }
                            className={`text-left p-3 rounded-xl border transition cursor-pointer disabled:cursor-default ${
                              isCurrent
                                ? "bg-[#2e1065] border-[#2e1065] text-white shadow-sm"
                                : isDone
                                ? "bg-emerald-50/70 border-emerald-200 text-emerald-900 hover:border-emerald-400"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:border-[#2e1065] hover:bg-white"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span
                                className={`text-[10px] font-mono font-bold uppercase ${
                                  isCurrent
                                    ? "text-purple-200"
                                    : isDone
                                    ? "text-emerald-700"
                                    : "text-slate-400"
                                }`}
                              >
                                Step {idx + 1}
                              </span>
                              {isDone && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs font-bold">{st.label}</p>
                            <p
                              className={`text-[10.5px] mt-0.5 ${
                                isCurrent
                                  ? "text-purple-100"
                                  : isDone
                                  ? "text-emerald-700"
                                  : "text-slate-400"
                              }`}
                            >
                              {st.sub}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      {nextStage ? (
                        <Button
                          type="button"
                          size="sm"
                          disabled={actionLoadingId === selectedOrder.id}
                          onClick={() =>
                            handleStatusUpdate(selectedOrder.id, nextStage.id)
                          }
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Move to {nextStage.label}</span>
                        </Button>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          Order fulfilled &amp; delivered
                        </span>
                      )}

                      <button
                        type="button"
                        disabled={actionLoadingId === selectedOrder.id}
                        onClick={() =>
                          handleStatusUpdate(selectedOrder.id, "CANCELLED")
                        }
                        className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    </div>
                  </div>
                );
              })()
            )}
          </CardContent>
        </Card>

        {/* Customer & Delivery Destination */}
        <Card>
          <CardContent className="p-5 sm:p-6 space-y-2.5 text-xs">
            <p className="font-bold uppercase tracking-wider text-slate-400 text-[10.5px]">
              Customer &amp; Delivery Destination
            </p>
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
          </CardContent>
        </Card>

        {/* Items Ordered with Product Images */}
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
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
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
