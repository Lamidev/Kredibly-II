"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Users,
  Search,
  MessageCircle,
  MapPin,
  ShoppingBag,
  Loader2,
  Mail,
  Phone,
} from "lucide-react";

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
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      const res = await api.get("/customers", { params });
      setCustomers(res.data.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push("/login");
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
          <h1 className="text-base font-bold text-white">Customers &amp; Buyers</h1>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          {customers.length} {customers.length === 1 ? "Buyer" : "Buyers"}
        </span>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search buyer name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs transition"
          >
            Search
          </button>
        </form>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-20 px-4 rounded-3xl bg-slate-900/40 border border-slate-800/80 flex flex-col items-center max-w-lg mx-auto">
            <div className="h-14 w-14 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mb-4">
              <Users className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">No buyers recorded yet</h2>
            <p className="text-sm text-slate-400">
              When customers place orders on your store, their contact info and purchase history appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customers.map((c) => {
              const whatsappNum = c.phoneNumber.replace(/^0/, "234").replace(/\D/g, "");
              return (
                <div
                  key={c.id}
                  className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-white text-sm">{c.fullName}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {c.phoneNumber}
                        </span>
                        {c.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-500" />
                            {c.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <a
                      href={`https://wa.me/${whatsappNum}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold inline-flex items-center gap-1.5 transition shrink-0"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  </div>

                  {(c.address || c.state) && (
                    <div className="text-xs text-slate-400 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span>
                        {[c.address, c.city, c.state].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                    <div>
                      <p className="text-slate-500 text-[11px]">Total Spent</p>
                      <p className="font-extrabold text-brand-400">
                        {formatCurrency(c.totalSpent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[11px]">Orders</p>
                      <p className="font-bold text-white">
                        {c.paidOrdersCount} paid / {c.totalOrders} total
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[11px]">Last Order</p>
                      <p className="font-medium text-slate-300">
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
                        <span
                          key={ord.id}
                          className="inline-flex items-center gap-1 text-[11px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-md text-slate-300 font-mono"
                        >
                          <ShoppingBag className="w-3 h-3 text-brand-500" />
                          #{ord.orderNumber} ({formatCurrency(ord.totalAmount)})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
