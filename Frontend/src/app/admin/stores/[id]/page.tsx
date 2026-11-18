"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  ShoppingBag,
  Package,
  Users,
} from "lucide-react";

export default function AdminStoreDetailPage() {
  const params = useParams<{ id: string }>();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"orders" | "customers" | "products">("orders");

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/admin/stores/${params.id}`);
        setStore(res.data.data);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [params.id]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#2e1065]" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="py-16 text-center space-y-3">
        <p className="text-sm font-semibold text-[#0f172a]">Store not found</p>
        <Link
          href="/admin/stores"
          className="text-xs font-semibold text-[#2e1065] hover:underline"
        >
          ← Back to Stores
        </Link>
      </div>
    );
  }

  const { stats } = store;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/admin/stores"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0f172a]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Stores</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#0f172a] tracking-tight">
              {store.name}
            </h1>
            <p className="text-xs text-slate-500">
              {store.slug}.kredibly.shop • Owner: {store.owner?.fullName} (
              {store.owner?.email})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{store.subscriptionTier}</Badge>
            <Badge variant={store.isActive ? "success" : "destructive"}>
              {store.isActive ? "Active" : "Suspended"}
            </Badge>
          </div>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Revenue
              </span>
              <TrendingUp className="w-4 h-4 text-slate-500" />
            </div>
            <p className="font-display text-xl sm:text-2xl font-bold text-[#0f172a]">
              {formatCurrency(stats.totalGmv)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Wallet: {formatCurrency(store.wallet?.availableBalance || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Orders
              </span>
              <ShoppingBag className="w-4 h-4 text-slate-500" />
            </div>
            <p className="font-display text-xl sm:text-2xl font-bold text-[#0f172a]">
              {stats.totalOrders}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {stats.paidOrdersCount} paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Products
              </span>
              <Package className="w-4 h-4 text-slate-500" />
            </div>
            <p className="font-display text-xl sm:text-2xl font-bold text-[#0f172a]">
              {stats.totalProducts}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Listed in catalog
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Users / Buyers
              </span>
              <Users className="w-4 h-4 text-slate-500" />
            </div>
            <p className="font-display text-xl sm:text-2xl font-bold text-[#0f172a]">
              {stats.totalCustomers}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {stats.registeredCustomers} registered • {stats.guestCustomers}{" "}
              guest
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Store Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Website &amp; Payout Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <p className="text-slate-500">WhatsApp / Contact</p>
            <p className="font-semibold text-[#0f172a] mt-0.5">
              {store.whatsappNumber}
            </p>
            {store.address && (
              <p className="text-slate-500 mt-0.5">{store.address}</p>
            )}
          </div>
          <div>
            <p className="text-slate-500">Payout Bank</p>
            <p className="font-semibold text-[#0f172a] mt-0.5">
              {store.bankName
                ? `${store.bankName} • ${store.accountNumber}`
                : "Not linked"}
            </p>
            {store.accountName && (
              <p className="text-slate-500 mt-0.5">{store.accountName}</p>
            )}
          </div>
          <div>
            <p className="text-slate-500">KYC Status</p>
            <p className="font-semibold text-[#0f172a] mt-0.5">
              {store.kycStatus}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {(
          [
            { key: "orders", label: `Orders (${store.orders.length})` },
            { key: "customers", label: `Users (${store.customers.length})` },
            { key: "products", label: `Products (${store.products.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              tab === t.key
                ? "bg-[#2e1065] text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:text-[#0f172a]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "orders" && (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Order ID</th>
                <th className="px-5 py-3">Buyer</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {store.orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    No orders on this website yet.
                  </td>
                </tr>
              ) : (
                store.orders.map((ord: any) => (
                  <tr key={ord.id}>
                    <td className="px-5 py-3 font-mono font-bold text-[#0f172a]">
                      #{ord.orderNumber}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-[#0f172a]">
                        {ord.customer?.fullName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {ord.customer?.phoneNumber} •{" "}
                        {ord.customer?.isRegistered ? "Registered" : "Guest"}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={
                          ord.paymentStatus === "PAID" ? "success" : "warning"
                        }
                      >
                        {ord.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="secondary">{ord.orderStatus}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-[#0f172a]">
                      {formatCurrency(ord.totalAmount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "customers" && (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Orders</th>
                <th className="px-5 py-3 text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {store.customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    No users on this website yet.
                  </td>
                </tr>
              ) : (
                store.customers.map((c: any) => (
                  <tr key={c.id}>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-[#0f172a]">
                        {c.fullName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {c.phoneNumber}
                        {c.email ? ` • ${c.email}` : ""}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={c.isRegistered ? "success" : "secondary"}>
                        {c.isRegistered ? "Registered" : "Guest"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-5 py-3 font-semibold text-[#0f172a]">
                      {c.ordersCount}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-[#0f172a]">
                      {formatCurrency(c.totalSpent)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "products" && (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3 text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {store.products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                    No products listed on this website yet.
                  </td>
                </tr>
              ) : (
                store.products.map((p: any) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3 font-semibold text-[#0f172a]">
                      {p.title}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {p.category || "—"}
                    </td>
                    <td className="px-5 py-3 font-mono">{p.stockQuantity}</td>
                    <td className="px-5 py-3 text-right font-bold text-[#0f172a]">
                      {formatCurrency(p.basePrice)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
