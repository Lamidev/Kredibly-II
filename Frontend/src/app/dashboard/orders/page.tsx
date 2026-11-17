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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchOrders = async (status = activeTab) => {
    try {
      const params: Record<string, string> = {};
      if (status !== "ALL") params.status = status;

      const res = await api.get("/orders", { params });
      setOrders(res.data.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push("/login");
      } else {
        toast.error("Failed to load orders.");
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
      toast.success(`Order status updated to ${newStatus}.`);
      await fetchOrders(activeTab);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update order status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <Badge variant="warning">
            <Clock className="w-3 h-3" /> Paid (Ready to Pack)
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
            <CheckCircle2 className="w-3 h-3" /> Delivered (Escrow Cleared)
          </Badge>
        );
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

  return (
    <div className="space-y-6">
      {/* Page Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
            Order Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pack paid orders, dispatch deliveries, and release escrow to your wallet.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl text-xs overflow-x-auto">
          {["ALL", "PAID", "SHIPPED", "DELIVERED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition shrink-0 cursor-pointer ${
                activeTab === tab
                  ? "bg-[#2e1065] text-white shadow-2xs"
                  : "text-slate-600 hover:text-[#0f172a] hover:bg-slate-50"
              }`}
            >
              {tab === "ALL" ? "All Orders" : tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#2e1065]" />
        </div>
      ) : orders.length === 0 ? (
        <Card className="max-w-lg mx-auto">
          <CardContent className="text-center py-14 px-6 flex flex-col items-center">
            <div className="h-14 w-14 rounded-2xl bg-[#2e1065]/10 text-[#2e1065] flex items-center justify-center mb-4">
              <Package className="w-7 h-7" />
            </div>
            <h2 className="text-base font-bold text-[#0f172a] mb-1">
              No orders found
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              When customers complete purchases from your store link, their orders will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isActionLoading = actionLoadingId === order.id;

            return (
              <Card key={order.id}>
                <CardContent className="p-5 sm:p-6 space-y-4">
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-extrabold text-base text-[#0f172a]">
                        #{order.orderNumber}
                      </span>
                      {getStatusBadge(order.orderStatus)}
                    </div>

                    <span className="text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 text-xs text-slate-600">
                      <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
                        Customer &amp; Delivery Info
                      </h4>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-bold text-[#0f172a]">
                          {order.customer.fullName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-mono">
                          {order.customer.phoneNumber}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span>
                          {order.customer.address},{" "}
                          {order.customer.city ? `${order.customer.city}, ` : ""}
                          {order.customer.state}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
                        Items Ordered
                      </h4>
                      <div className="space-y-1.5 divide-y divide-slate-100">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="pt-1.5 first:pt-0 flex items-center justify-between"
                          >
                            <span className="text-slate-700">
                              <span className="font-bold text-[#2e1065]">
                                {item.quantity}x
                              </span>{" "}
                              {item.productTitle}{" "}
                              {item.variantName && `(${item.variantName})`}
                            </span>
                            <span className="font-mono font-semibold text-[#0f172a]">
                              {formatCurrency(item.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-bold">
                        <span className="text-slate-500">Total:</span>
                        <span className="text-base text-[#2e1065]">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <a
                      href={getWhatsAppLink(order)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Chat with Buyer on WhatsApp</span>
                      </Button>
                    </a>

                    <div className="flex items-center gap-2">
                      {order.orderStatus === "PAID" && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(order.id, "SHIPPED")}
                          disabled={isActionLoading}
                        >
                          {isActionLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Truck className="w-3.5 h-3.5" />
                          )}
                          <span>Mark as Dispatched</span>
                        </Button>
                      )}

                      {order.orderStatus === "SHIPPED" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleStatusUpdate(order.id, "DELIVERED")
                          }
                          disabled={isActionLoading}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {isActionLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>Mark Delivered (Release Escrow)</span>
                        </Button>
                      )}

                      {order.orderStatus === "DELIVERED" && (
                        <Badge variant="success">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Escrow Released to Wallet
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
