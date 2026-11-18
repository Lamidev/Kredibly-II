"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
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
  ShieldCheck,
  RefreshCw,
  Search,
  Eye,
  TrendingUp,
  ShoppingBag,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface OrderItem {
  id: string;
  productTitle: string;
  variantName?: string | null;
  unitPrice: number | string;
  quantity: number;
  subtotal: number | string;
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
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await api.get("/orders");
      const list: Order[] = res.data.data || [];
      setOrders(list);
      if (selectedOrder) {
        const updated = list.find((o) => o.id === selectedOrder.id) || null;
        setSelectedOrder(updated);
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
    const cleanPhone = order.customer.phoneNumber.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Hi ${order.customer.fullName}! Thank you for your order #${order.orderNumber}. I'm following up regarding your delivery!`
    );
    return `https://wa.me/234${
      cleanPhone.startsWith("0") ? cleanPhone.slice(1) : cleanPhone
    }?text=${msg}`;
  };

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
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0f172a] whitespace-nowrap">
                        #{order.orderNumber}
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details & Fulfillment Modal */}
      <Dialog
        open={Boolean(selectedOrder)}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <DialogTitle className="font-mono">
                    Order #{selectedOrder.orderNumber}
                  </DialogTitle>
                  {getStatusBadge(selectedOrder.orderStatus)}
                </div>
                <DialogDescription>
                  Placed on{" "}
                  {new Date(selectedOrder.createdAt).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-xs">
                {/* Customer & Delivery */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-slate-600">
                  <p className="font-bold uppercase tracking-wider text-slate-400 text-[10.5px]">
                    Customer &amp; Delivery Info
                  </p>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-[#0f172a]">
                      {selectedOrder.customer.fullName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">
                      {selectedOrder.customer.phoneNumber}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      {selectedOrder.customer.address},{" "}
                      {selectedOrder.customer.city
                        ? `${selectedOrder.customer.city}, `
                        : ""}
                      {selectedOrder.customer.state}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="font-bold uppercase tracking-wider text-slate-400 text-[10.5px]">
                    Items Ordered
                  </p>
                  <div className="divide-y divide-slate-200/70">
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-2"
                      >
                        <span className="text-[#0f172a]">
                          <strong className="text-[#2e1065]">{item.quantity}x</strong>{" "}
                          {item.productTitle}{" "}
                          {item.variantName && `(${item.variantName})`}
                        </span>
                        <span className="font-mono font-semibold text-[#0f172a] shrink-0">
                          {formatCurrency(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold">
                    <span className="text-slate-500">Total</span>
                    <span className="font-display text-base text-[#2e1065]">
                      {formatCurrency(selectedOrder.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <a
                    href={getWhatsAppLink(selectedOrder)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button type="button" variant="outline" className="w-full">
                      <MessageCircle className="w-4 h-4 text-[#2e1065]" />
                      <span>Chat on WhatsApp</span>
                    </Button>
                  </a>

                  {selectedOrder.orderStatus === "PAID" && (
                    <Button
                      type="button"
                      onClick={() =>
                        handleStatusUpdate(selectedOrder.id, "SHIPPED")
                      }
                      disabled={actionLoadingId === selectedOrder.id}
                      className="flex-1"
                    >
                      {actionLoadingId === selectedOrder.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Truck className="w-4 h-4" />
                      )}
                      <span>Mark as Shipped</span>
                    </Button>
                  )}

                  {selectedOrder.orderStatus === "SHIPPED" && (
                    <Button
                      type="button"
                      onClick={() =>
                        handleStatusUpdate(selectedOrder.id, "DELIVERED")
                      }
                      disabled={actionLoadingId === selectedOrder.id}
                      className="flex-1"
                    >
                      {actionLoadingId === selectedOrder.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>Mark Delivered</span>
                    </Button>
                  )}

                  {selectedOrder.orderStatus === "DELIVERED" && (
                    <Badge variant="success" className="justify-center py-2 px-3">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Escrow Released
                    </Badge>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
