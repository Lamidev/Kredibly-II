"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Wallet,
  Store,
  ShoppingBag,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface OverviewData {
  totalStores: number;
  activeStores: number;
  totalOrders: number;
  paidOrdersCount: number;
  totalGmv: number;
  platformFeeRevenue: number;
  pendingKycCount: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    totalAmount: number | string;
    orderStatus: string;
    paymentStatus: string;
    createdAt: string;
    store: { name: string; slug: string };
    customer: { fullName: string; phoneNumber: string };
  }>;
}

export default function SuperAdminOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/overview");
      setData(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#2e1065]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0f172a] tracking-tight">
            Platform Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Live GMV, fee revenue, merchant stores, and recent platform orders.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOverview}>
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* 4 Minimalist KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Platform GMV
              </span>
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[#0f172a]">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="font-display text-xl sm:text-2xl font-bold text-[#0f172a]">
              {formatCurrency(data.totalGmv)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {data.paidOrdersCount} paid orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Fee Revenue
              </span>
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[#0f172a]">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <p className="font-display text-xl sm:text-2xl font-bold text-[#0f172a]">
              {formatCurrency(data.platformFeeRevenue)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Net transaction fees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Stores
              </span>
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[#0f172a]">
                <Store className="w-4 h-4" />
              </div>
            </div>
            <p className="font-display text-xl sm:text-2xl font-bold text-[#0f172a]">
              {data.totalStores}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {data.activeStores} active • {data.pendingKycCount} KYC pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Orders
              </span>
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[#0f172a]">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <p className="font-display text-xl sm:text-2xl font-bold text-[#0f172a]">
              {data.totalOrders}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Across all storefronts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Platform Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Platform Orders</CardTitle>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold text-[#2e1065] hover:underline"
          >
            View all →
          </Link>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-y border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Order ID</th>
                <th className="px-5 py-3">Store</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                    No platform orders yet.
                  </td>
                </tr>
              ) : (
                data.recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5 font-mono font-bold text-[#0f172a]">
                      #{ord.orderNumber}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-[#0f172a]">
                      {ord.store.name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {ord.customer.fullName}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="secondary">{ord.orderStatus}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-[#0f172a]">
                      {formatCurrency(ord.totalAmount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
