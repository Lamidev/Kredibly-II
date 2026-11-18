"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { formatCurrency } from "@/lib/utils";
import {
  Package,
  TrendingUp,
  BadgeCheck,
  Users,
  ArrowRight,
  Clock,
  Truck,
  CheckCircle2,
  Loader2,
  ShieldCheck,
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
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const [prodRes, ordRes, custRes] = await Promise.allSettled([
          api.get("/products"),
          api.get("/orders"),
          api.get("/customers"),
        ]);

        if (prodRes.status === "fulfilled") {
          setTotalProducts(prodRes.value.data?.data?.length || 0);
        }
        if (ordRes.status === "fulfilled") {
          setOrders(ordRes.value.data?.data || []);
        }
        if (custRes.status === "fulfilled") {
          setTotalCustomers(custRes.value.data?.data?.length || 0);
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

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
            Welcome back, {user?.fullName?.split(" ")[0] || "Merchant"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track your store performance, inventory, and incoming orders.
          </p>
        </div>
        <Badge variant="success" className="w-fit">
          <ShieldCheck className="w-3.5 h-3.5" />
          Storefront Live
        </Badge>
      </div>

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
            <div className="overflow-x-auto">
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
                  {orders.slice(0, 8).map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/60 transition"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0f172a] whitespace-nowrap">
                        #{order.orderNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-[#0f172a]">
                          {order.customer.fullName}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {order.customer.phoneNumber}
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
                        {getStatusBadge(order.orderStatus)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
