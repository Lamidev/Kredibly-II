"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, Loader2 } from "lucide-react";

interface AdminOrder {
  id: string;
  orderNumber: string;
  totalAmount: number | string;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  store: { name: string; slug: string };
  customer: { fullName: string; phoneNumber: string; state?: string | null };
  items: Array<{ id: string; productTitle: string; quantity: number }>;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/admin/orders?status=${statusFilter}&search=${encodeURIComponent(search)}`
      );
      setOrders(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleStatusChange = async (orderId: string, orderStatus: string) => {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { orderStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, orderStatus } : o))
      );
      toast.success("Order status updated.");
    } catch {
      toast.error("Failed to update order status.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0f172a] tracking-tight">
            All Platform Orders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor orders across all storefronts and update fulfillment statuses.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders}>
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          {["ALL", "PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"].map(
            (st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statusFilter === st
                    ? "bg-[#2e1065] text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:text-[#0f172a]"
                }`}
              >
                {st === "ALL" ? "All" : st}
              </button>
            )
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchOrders();
          }}
          className="relative w-full sm:w-72"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Order #, store, buyer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-white border border-slate-200 text-xs text-[#0f172a] focus:outline-none focus:border-[#2e1065]"
          />
        </form>
      </div>

      <Card className="overflow-x-auto">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#2e1065]" />
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Store</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5 font-mono font-bold text-[#0f172a]">
                      #{ord.orderNumber}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-[#0f172a]">
                      {ord.store.name}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-[#0f172a]">
                        {ord.customer.fullName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {ord.customer.phoneNumber}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={
                          ord.paymentStatus === "PAID" ? "success" : "warning"
                        }
                      >
                        {ord.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={ord.orderStatus}
                        onChange={(e) =>
                          handleStatusChange(ord.id, e.target.value)
                        }
                        className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-[#0f172a]"
                      >
                        {[
                          "PENDING",
                          "PAID",
                          "PROCESSING",
                          "SHIPPED",
                          "DELIVERED",
                          "CANCELLED",
                        ].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-[#0f172a]">
                      {formatCurrency(ord.totalAmount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
