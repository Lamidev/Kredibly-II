"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  RefreshCw,
  Loader2,
  X,
  Trash2,
  Unlock,
} from "lucide-react";

interface AdminStore {
  id: string;
  name: string;
  slug: string;
  subscriptionTier: "STARTER" | "PRO" | "BUSINESS";
  isActive: boolean;
  kycStatus: string;
  withdrawalLockedUntil?: string | null;
  createdAt: string;
  owner: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    emailVerified: boolean;
  };
  wallet?: {
    availableBalance: number | string;
    escrowBalance: number | string;
  } | null;
  _count: {
    products: number;
    orders: number;
  };
}

export default function AdminStoresPage() {
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [selectedStore, setSelectedStore] = useState<AdminStore | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/admin/stores?tier=${tierFilter}&search=${encodeURIComponent(search)}`
      );
      setStores(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [tierFilter]);

  const handleUpdateStore = async (
    id: string,
    payload: {
      subscriptionTier?: "STARTER" | "PRO" | "BUSINESS";
      isActive?: boolean;
      clearWithdrawalLock?: boolean;
    }
  ) => {
    setUpdating(true);
    try {
      const res = await api.patch(`/admin/stores/${id}`, payload);
      setStores((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...res.data.data } : s))
      );
      setSelectedStore((prev) =>
        prev && prev.id === id ? { ...prev, ...res.data.data } : prev
      );
      toast.success("Store updated.");
    } catch {
      toast.error("Failed to update store.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteStore = async (id: string) => {
    if (!confirm("Permanently delete this merchant account and store?")) return;
    setUpdating(true);
    try {
      await api.delete(`/admin/stores/${id}`);
      setStores((prev) => prev.filter((s) => s.id !== id));
      setSelectedStore(null);
      toast.success("Store deleted.");
    } catch {
      toast.error("Failed to delete store.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0f172a] tracking-tight">
            Stores &amp; Merchants
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage plans, suspend/reactivate storefronts, and clear payout locks.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStores}>
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          {["ALL", "STARTER", "PRO", "BUSINESS"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTierFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                tierFilter === t
                  ? "bg-[#2e1065] text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:text-[#0f172a]"
              }`}
            >
              {t === "ALL" ? "All Plans" : t}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchStores();
          }}
          className="relative w-full sm:w-72"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search store, slug, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-white border border-slate-200 text-xs text-[#0f172a] focus:outline-none focus:border-[#2e1065]"
          />
        </form>
      </div>

      {/* Directory Table */}
      <Card className="overflow-x-auto">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#2e1065]" />
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Store</th>
                <th className="px-5 py-3">Owner</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Balance</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    No stores found.
                  </td>
                </tr>
              ) : (
                stores.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/stores/${s.id}`}
                        className="font-bold text-[#0f172a] hover:text-[#2e1065] hover:underline"
                      >
                        {s.name}
                      </Link>
                      <p className="text-[11px] text-slate-500">
                        {s.slug}.kredibly.shop
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-[#0f172a]">
                        {s.owner.fullName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {s.owner.email}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="secondary">{s.subscriptionTier}</Badge>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-[#0f172a]">
                      {formatCurrency(s.wallet?.availableBalance || 0)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={s.isActive ? "success" : "destructive"}>
                        {s.isActive ? "Active" : "Suspended"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/admin/stores/${s.id}`}
                          className="text-xs font-semibold text-[#2e1065] hover:underline"
                        >
                          Details
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedStore(s)}
                        >
                          Manage
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </Card>

      {/* Manage Store Modal */}
      {selectedStore && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-[#0f172a]">
                  {selectedStore.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedStore.owner.email} • {selectedStore._count.products}{" "}
                  products • {selectedStore._count.orders} orders
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStore(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#0f172a]">
                Subscription Plan
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["STARTER", "PRO", "BUSINESS"] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    disabled={updating}
                    onClick={() =>
                      handleUpdateStore(selectedStore.id, {
                        subscriptionTier: tier,
                      })
                    }
                    className={`py-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      selectedStore.subscriptionTier === tier
                        ? "bg-[#2e1065] border-[#2e1065] text-white"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-[#2e1065]"
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <Button
                variant={selectedStore.isActive ? "outline" : "default"}
                disabled={updating}
                onClick={() =>
                  handleUpdateStore(selectedStore.id, {
                    isActive: !selectedStore.isActive,
                  })
                }
              >
                {selectedStore.isActive
                  ? "Suspend Storefront"
                  : "Reactivate Storefront"}
              </Button>

              {selectedStore.withdrawalLockedUntil && (
                <Button
                  variant="outline"
                  disabled={updating}
                  onClick={() =>
                    handleUpdateStore(selectedStore.id, {
                      clearWithdrawalLock: true,
                    })
                  }
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Clear 24h Withdrawal Lock</span>
                </Button>
              )}

              <Button
                variant="outline"
                disabled={updating}
                onClick={() => handleDeleteStore(selectedStore.id)}
                className="text-red-600 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Merchant &amp; Store</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
