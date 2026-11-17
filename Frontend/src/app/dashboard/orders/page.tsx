"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  MessageCircle,
  MapPin,
  Phone,
  User,
  Search,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchOrders = async (status = activeTab) => {
    try {
      const params: any = {};
      if (status !== "ALL") params.status = status;
      if (searchQuery) params.search = searchQuery;

      const res = await api.get("/orders", { params });
      setOrders(res.data.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(activeTab);
  }, [activeTab]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setActionLoadingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      await fetchOrders(activeTab);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update order status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold">
            <Clock className="w-3 h-3" /> Paid (Ready to Pack)
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold">
            <Package className="w-3 h-3" /> Processing
          </span>
        );
      case "SHIPPED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold">
            <Truck className="w-3 h-3" /> Dispatched
          </span>
        );
      case "DELIVERED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 text-xs font-bold">
            <CheckCircle2 className="w-3 h-3" /> Delivered (Escrow Cleared)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-bold">
            {status}
          </span>
        );
    }
  };

  const getWhatsAppLink = (order: Order) => {
    const cleanPhone = order.customer.phoneNumber.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Hi ${order.customer.fullName}! Thank you for your order #${order.orderNumber}. I'm following up regarding your delivery!`
    );
    return `https://wa.me/234${cleanPhone.startsWith("0") ? cleanPhone.slice(1) : cleanPhone}?text=${msg}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-base font-bold text-white">Order Management</h1>
        </div>

        {/* Tab Filters */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          {["ALL", "PAID", "SHIPPED", "DELIVERED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === tab
                  ? "bg-brand-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab === "ALL" ? "All Orders" : tab}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Mobile Filter Tabs */}
        <div className="flex sm:hidden overflow-x-auto gap-2 pb-2">
          {["ALL", "PAID", "SHIPPED", "DELIVERED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition ${
                activeTab === tab
                  ? "bg-brand-500 text-slate-950"
                  : "bg-slate-900 border border-slate-800 text-slate-300"
              }`}
            >
              {tab === "ALL" ? "All" : tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 px-4 rounded-3xl bg-slate-900/40 border border-slate-800/80 flex flex-col items-center max-w-lg mx-auto">
            <div className="h-14 w-14 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mb-4">
              <Package className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">
              No orders found
            </h2>
            <p className="text-sm text-slate-400">
              When customers complete purchases from your store bio link, their orders will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isActionLoading = actionLoadingId === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg space-y-4"
                >
                  {/* Top Bar: Order Number, Date, Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3.5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-extrabold text-base text-white">
                        #{order.orderNumber}
                      </span>
                      {getStatusBadge(order.orderStatus)}
                    </div>

                    <span className="text-xs text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Body: Two Column Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer & Delivery */}
                    <div className="space-y-2 text-xs text-slate-300">
                      <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
                        Customer & Delivery Info
                      </h4>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="font-bold text-white">
                          {order.customer.fullName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="font-mono">
                          {order.customer.phoneNumber}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        <span>
                          {order.customer.address},{" "}
                          {order.customer.city ? `${order.customer.city}, ` : ""}
                          {order.customer.state}
                        </span>
                      </div>
                    </div>

                    {/* Ordered Items */}
                    <div className="space-y-2 text-xs">
                      <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
                        Items Ordered
                      </h4>
                      <div className="space-y-1.5 divide-y divide-slate-800/60">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="pt-1.5 first:pt-0 flex items-center justify-between"
                          >
                            <span className="text-slate-200">
                              <span className="font-bold text-brand-400">
                                {item.quantity}x
                              </span>{" "}
                              {item.productTitle}{" "}
                              {item.variantName && `(${item.variantName})`}
                            </span>
                            <span className="font-mono text-white">
                              {formatCurrency(item.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold">
                        <span className="text-slate-400">Total:</span>
                        <span className="text-base text-brand-400">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                    {/* WhatsApp Buyer Link */}
                    <a
                      href={getWhatsAppLink(order)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-500" />
                      <span>Chat with Buyer on WhatsApp</span>
                    </a>

                    {/* Status Triggers */}
                    <div className="flex items-center gap-2">
                      {order.orderStatus === "PAID" && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, "SHIPPED")}
                          disabled={isActionLoading}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isActionLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Truck className="w-3.5 h-3.5" />
                          )}
                          <span>Mark as Dispatched</span>
                        </button>
                      )}

                      {order.orderStatus === "SHIPPED" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(order.id, "DELIVERED")
                          }
                          disabled={isActionLoading}
                          className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 text-xs font-extrabold transition flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-brand-500/20"
                        >
                          {isActionLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>Mark Delivered (Release Escrow)</span>
                        </button>
                      )}

                      {order.orderStatus === "DELIVERED" && (
                        <span className="text-xs text-brand-400 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-4 h-4 text-brand-500" />
                          Escrow Released to Wallet
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
