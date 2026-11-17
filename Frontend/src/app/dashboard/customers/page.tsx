"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  Search,
  MessageCircle,
  MapPin,
  ShoppingBag,
  Loader2,
  Mail,
  Phone,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCustomers = async (search = searchQuery) => {
    try {
      const params: Record<string, string> = {};
      if (search.trim()) params.search = search.trim();
      const res = await api.get("/customers", { params });
      setCustomers(res.data.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push("/login");
      } else {
        toast.error("Failed to load customers.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchCustomers(searchQuery);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
            Customers &amp; Buyers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Every buyer who orders from your store is saved here automatically.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit">
          {customers.length} {customers.length === 1 ? "Buyer" : "Buyers"}
        </Badge>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search buyer name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:border-[#2e1065]"
          />
        </div>
        <Button type="submit" size="default">
          Search
        </Button>
      </form>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#2e1065]" />
        </div>
      ) : customers.length === 0 ? (
        <Card className="max-w-lg mx-auto">
          <CardContent className="text-center py-14 px-6 flex flex-col items-center">
            <div className="h-14 w-14 rounded-2xl bg-[#2e1065]/10 text-[#2e1065] flex items-center justify-center mb-4">
              <Users className="w-7 h-7" />
            </div>
            <h2 className="text-base font-bold text-[#0f172a] mb-1">
              No buyers recorded yet
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              When customers place orders on your store, their contact info and purchase history appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customers.map((c) => {
            const whatsappNum = c.phoneNumber
              .replace(/^0/, "234")
              .replace(/\D/g, "");
            return (
              <Card key={c.id}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-[#0f172a] text-sm">
                        {c.fullName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {c.phoneNumber}
                        </span>
                        {c.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {c.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <a
                      href={`https://wa.me/${whatsappNum}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp
                      </Button>
                    </a>
                  </div>

                  {(c.address || c.state) && (
                    <div className="text-xs text-slate-500 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>
                        {[c.address, c.city, c.state].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <p className="text-slate-400 text-[11px]">Total Spent</p>
                      <p className="font-extrabold text-[#2e1065]">
                        {formatCurrency(c.totalSpent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[11px]">Orders</p>
                      <p className="font-bold text-[#0f172a]">
                        {c.paidOrdersCount} paid / {c.totalOrders}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[11px]">Last Order</p>
                      <p className="font-medium text-slate-600">
                        {c.lastOrderAt
                          ? new Date(c.lastOrderAt).toLocaleDateString("en-NG", {
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {c.recentOrders.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {c.recentOrders.map((ord) => (
                        <Badge key={ord.id} variant="outline" className="font-mono">
                          <ShoppingBag className="w-3 h-3 text-[#2e1065]" />
                          #{ord.orderNumber} ({formatCurrency(ord.totalAmount)})
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
