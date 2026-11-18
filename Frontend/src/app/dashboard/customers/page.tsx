"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  ShoppingBag,
  TrendingUp,
  Award,
  Search,
  RefreshCw,
  MapPin,
  Eye,
  MessageCircle,
  Loader2,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface CustomerOrder {
  id: string;
  orderNumber: string;
  totalAmount: number | string;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
}

interface Customer {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  createdAt?: string;
  totalOrders: number;
  paidOrdersCount: number;
  totalSpent: number;
  lastOrderAt?: string | null;
  recentOrders: CustomerOrder[];
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const fetchCustomers = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await api.get("/customers");
      setCustomers(res.data.data || []);
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push("/login");
      } else {
        toast.error("Failed to load customers.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.phoneNumber.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.state && c.state.toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q))
    );
  });

  const totalCustomers = customers.length;
  const activeBuyers = customers.filter((c) => c.paidOrdersCount >= 1).length;
  const totalLtv = customers.reduce((sum, c) => sum + Number(c.totalSpent || 0), 0);
  const repeatBuyers = customers.filter((c) => c.paidOrdersCount >= 2).length;

  const getWhatsAppLink = (phone: string) => {
    const clean = phone.replace(/\D/g, "");
    const intl = clean.startsWith("0") ? `234${clean.slice(1)}` : clean;
    return `https://wa.me/${intl}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a] tracking-tight">
            Customers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Buyer directory, verified purchase history, and customer lifetime value.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fetchCustomers(true)}
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
                Total Customers
              </span>
              <span className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/70 flex items-center justify-center text-[#0f172a]">
                <Users className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="font-display text-2xl font-bold text-[#0f172a]">
              {loading ? "—" : totalCustomers}
            </p>
            <p className="text-[11px] text-slate-500">All recorded buyers</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                Active Buyers
              </span>
              <span className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/70 flex items-center justify-center text-[#0f172a]">
                <ShoppingBag className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="font-display text-2xl font-bold text-[#0f172a]">
              {loading ? "—" : activeBuyers}
            </p>
            <p className="text-[11px] text-slate-500">Completed 1+ orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                Total Customer LTV
              </span>
              <span className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/70 flex items-center justify-center text-[#2e1065]">
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="font-display text-2xl font-bold text-[#0f172a] truncate">
              {loading ? "—" : formatCurrency(totalLtv)}
            </p>
            <p className="text-[11px] text-slate-500">Total order revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                Repeat Buyers
              </span>
              <span className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/70 flex items-center justify-center text-[#0f172a]">
                <Award className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="font-display text-2xl font-bold text-[#0f172a]">
              {loading ? "—" : repeatBuyers}
            </p>
            <p className="text-[11px] text-slate-500">Purchased 2+ times</p>
          </CardContent>
        </Card>
      </div>

      {/* Full-Width Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by name, email, phone, or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-sm text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:border-[#2e1065] shadow-2xs"
        />
      </div>

      {/* Customer Directory Table Card */}
      <Card>
        <CardHeader className="pb-4 border-b border-slate-100">
          <CardTitle>Customer Directory</CardTitle>
          <CardDescription>
            Showing {filteredCustomers.length} total customer{" "}
            {filteredCustomers.length === 1 ? "record" : "records"}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#2e1065]" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-16 px-4 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-[#0f172a]">
                No customers found
              </p>
              <p className="text-xs text-slate-500">
                Buyers who place orders on your store will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50/70">
                    <th className="py-3 px-4 font-semibold">Customer</th>
                    <th className="py-3 px-4 font-semibold">Contact</th>
                    <th className="py-3 px-4 font-semibold hidden md:table-cell">
                      Location
                    </th>
                    <th className="py-3 px-4 font-semibold">Orders</th>
                    <th className="py-3 px-4 font-semibold">Lifetime Value</th>
                    <th className="py-3 px-4 font-semibold hidden lg:table-cell">
                      Joined Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map((c) => {
                    const initial = c.fullName?.charAt(0)?.toUpperCase() || "C";
                    const shortCode = `CUST-${c.id.slice(-6).toUpperCase()}`;
                    const locationText =
                      [c.city, c.state].filter(Boolean).join(", ") || "Nigeria";
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCustomer(c)}
                        className="hover:bg-slate-50/80 transition cursor-pointer"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#2e1065] text-white font-display font-bold text-xs flex items-center justify-center shrink-0">
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#0f172a] truncate">
                                {c.fullName}
                              </p>
                              <p className="text-[10.5px] font-mono text-slate-400">
                                {shortCode}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-[#0f172a] font-medium truncate max-w-[180px]">
                            {c.email || "—"}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {c.phoneNumber}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 hidden md:table-cell text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {locationText}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="outline" className="font-mono">
                            {c.totalOrders}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0f172a]">
                          {formatCurrency(c.totalSpent)}
                        </td>
                        <td className="py-3.5 px-4 hidden lg:table-cell text-slate-500 whitespace-nowrap">
                          {c.createdAt
                            ? `Since ${new Date(c.createdAt).toLocaleDateString("en-NG", {
                                month: "short",
                                year: "numeric",
                              })}`
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Details Modal */}
      <Dialog
        open={Boolean(selectedCustomer)}
        onOpenChange={(open) => !open && setSelectedCustomer(null)}
      >
        <DialogContent className="max-w-md">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCustomer.fullName}</DialogTitle>
                <DialogDescription>
                  {selectedCustomer.phoneNumber}
                  {selectedCustomer.email ? ` • ${selectedCustomer.email}` : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-slate-500">Lifetime Spend</p>
                    <p className="font-display text-base font-bold text-[#2e1065]">
                      {formatCurrency(selectedCustomer.totalSpent)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Orders</p>
                    <p className="font-display text-base font-bold text-[#0f172a]">
                      {selectedCustomer.paidOrdersCount} paid /{" "}
                      {selectedCustomer.totalOrders} total
                    </p>
                  </div>
                </div>

                {(selectedCustomer.address || selectedCustomer.state) && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <p className="font-semibold text-[#0f172a]">Delivery Address</p>
                    <p className="text-slate-600">
                      {[
                        selectedCustomer.address,
                        selectedCustomer.city,
                        selectedCustomer.state,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                )}

                {selectedCustomer.recentOrders.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-semibold text-[#0f172a]">Recent Orders</p>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                      {selectedCustomer.recentOrders.map((ord) => (
                        <div
                          key={ord.id}
                          className="px-3.5 py-2.5 flex items-center justify-between bg-white"
                        >
                          <div>
                            <p className="font-mono font-bold text-[#0f172a]">
                              #{ord.orderNumber}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {new Date(ord.createdAt).toLocaleDateString("en-NG", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-bold text-[#0f172a]">
                              {formatCurrency(ord.totalAmount)}
                            </p>
                            <Badge variant="outline" className="text-[10px]">
                              {ord.orderStatus}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <a
                  href={getWhatsAppLink(selectedCustomer.phoneNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button type="button" className="w-full">
                    <MessageCircle className="w-4 h-4" />
                    <span>Message on WhatsApp</span>
                  </Button>
                </a>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
