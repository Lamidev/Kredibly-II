"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CreditCard,
  TrendingUp,
  Users,
  Clock,
  Loader2,
  Search,
  Save,
  Settings2,
} from "lucide-react";

type TierKey = "STARTER" | "STARTER_PLUS" | "PRO" | "BUSINESS";

interface PlanConfig {
  id: string;
  tier: TierKey;
  name: string;
  tagline?: string | null;
  monthlyPrice: number;
  annualPrice: number;
  maxProducts: number;
  maxImagesPerProduct: number;
  platformFeePercent: number;
  allowPassFee: boolean;
  allowPromoCodes: boolean;
  allowOfferBanner: boolean;
  allowCustomDomain: boolean;
  isActive: boolean;
}

interface StoreSubRow {
  id: string;
  name: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  subscriptionTier: TierKey;
  subscriptionEnd: string | null;
  daysRemaining: number | null;
  isInGracePeriod: boolean;
  productCount: number;
  totalPaid: number;
}

interface PaidBreakdown {
  tier: TierKey;
  name: string;
  monthlyPrice: number;
  totalPaid: number;
  paymentsCount: number;
  activeCount: number;
}

interface PaymentRecord {
  id: string;
  tier: TierKey;
  billingCycle: string;
  amount: number;
  paymentMethod: string;
  reference: string;
  periodEnd: string;
  createdAt: string;
  store: { name: string; slug: string };
}

interface AdminSubsData {
  totalPaidSubscriptionRevenue: number;
  freePlanProfit: number;
  freePlanSalesVolume: number;
  freePlanPaidOrders: number;
  freePlanStoresCount: number;
  activePaidSubscriptionsCount: number;
  expiringSoonCount: number;
  paidPlanBreakdown: PaidBreakdown[];
  plans: PlanConfig[];
  stores: StoreSubRow[];
  recentPayments: PaymentRecord[];
}

const TIER_LABELS: Record<TierKey, string> = {
  STARTER: "Starter (Free)",
  STARTER_PLUS: "Starter Plus",
  PRO: "Deluxe (Pro)",
  BUSINESS: "Ultimate (Scale)",
};

function CountdownBadge({
  tier,
  daysRemaining,
  isInGracePeriod,
}: {
  tier: TierKey;
  daysRemaining: number | null;
  isInGracePeriod: boolean;
}) {
  if (tier === "STARTER") {
    return <Badge variant="secondary">Free Plan</Badge>;
  }
  if (daysRemaining === null) {
    return <Badge variant="success">Lifetime / No Expiry</Badge>;
  }
  if (isInGracePeriod) {
    return (
      <Badge variant="destructive">
        Grace ({Math.abs(daysRemaining)}d overdue)
      </Badge>
    );
  }
  if (daysRemaining < 0) {
    return <Badge variant="destructive">Expired</Badge>;
  }
  if (daysRemaining === 0) {
    return <Badge variant="warning">Expires today</Badge>;
  }
  if (daysRemaining <= 7) {
    return <Badge variant="warning">{daysRemaining}d left</Badge>;
  }
  return <Badge variant="success">{daysRemaining}d left</Badge>;
}

export default function AdminSubscriptionsPage() {
  const [data, setData] = useState<AdminSubsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("ALL");

  const [editingPlans, setEditingPlans] = useState<Record<string, PlanConfig>>({});
  const [savingTier, setSavingTier] = useState<string | null>(null);

  const [manageStore, setManageStore] = useState<StoreSubRow | null>(null);
  const [grantTier, setGrantTier] = useState<TierKey>("PRO");
  const [grantDays, setGrantDays] = useState("30");
  const [grantAmount, setGrantAmount] = useState("0");
  const [grantSaving, setGrantSaving] = useState(false);

  const loadData = async () => {
    try {
      const res = await api.get("/admin/subscriptions");
      const d: AdminSubsData = res.data.data;
      setData(d);
      const map: Record<string, PlanConfig> = {};
      d.plans.forEach((p) => {
        map[p.tier] = { ...p };
      });
      setEditingPlans(map);
    } catch {
      toast.error("Failed to load subscription analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredStores = useMemo(() => {
    if (!data) return [];
    return data.stores.filter((s) => {
      if (tierFilter === "EXPIRING") {
        if (
          s.subscriptionTier === "STARTER" ||
          s.daysRemaining === null ||
          s.daysRemaining > 7
        ) {
          return false;
        }
      } else if (tierFilter !== "ALL" && s.subscriptionTier !== tierFilter) {
        return false;
      }

      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        s.ownerName.toLowerCase().includes(q) ||
        s.ownerEmail.toLowerCase().includes(q)
      );
    });
  }, [data, tierFilter, searchQuery]);

  const handleSavePlan = async (tier: TierKey) => {
    const plan = editingPlans[tier];
    if (!plan) return;
    setSavingTier(tier);
    try {
      await api.put(`/admin/subscriptions/plans/${tier}`, {
        name: plan.name,
        tagline: plan.tagline,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice,
        maxProducts: plan.maxProducts,
        maxImagesPerProduct: plan.maxImagesPerProduct,
        platformFeePercent: plan.platformFeePercent,
        allowPassFee: plan.allowPassFee,
        allowPromoCodes: plan.allowPromoCodes,
        allowOfferBanner: plan.allowOfferBanner,
        allowCustomDomain: plan.allowCustomDomain,
      });
      toast.success(`${plan.name} updated.`);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update plan.");
    } finally {
      setSavingTier(null);
    }
  };

  const handleOpenManage = (store: StoreSubRow) => {
    setManageStore(store);
    setGrantTier(store.subscriptionTier === "STARTER" ? "STARTER_PLUS" : store.subscriptionTier);
    setGrantDays("30");
    setGrantAmount("0");
  };

  const handleGrantSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageStore) return;
    setGrantSaving(true);
    try {
      await api.post(`/admin/subscriptions/stores/${manageStore.id}`, {
        tier: grantTier,
        durationDays: Number(grantDays) || 30,
        amountPaid: Number(grantAmount) || 0,
      });
      toast.success(`Updated ${manageStore.name} to ${TIER_LABELS[grantTier]}.`);
      setManageStore(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update store plan.");
    } finally {
      setGrantSaving(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#2e1065]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#0f172a]">
          Subscriptions &amp; Plan Revenue
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitor paid plan revenue, free-tier transaction profit, active subscriptions, and account countdowns.
        </p>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 sm:p-5 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Paid Plan Revenue</span>
              <CreditCard className="w-4 h-4 text-[#2e1065]" />
            </div>
            <p className="font-mono text-xl sm:text-2xl font-extrabold text-[#0f172a]">
              {formatCurrency(data.totalPaidSubscriptionRevenue)}
            </p>
            <p className="text-[11px] text-slate-500">
              All completed plan payments
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardContent className="p-4 sm:p-5 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
              <span>Free Plan Profit (2.5%)</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="font-mono text-xl sm:text-2xl font-extrabold text-emerald-900">
              {formatCurrency(data.freePlanProfit)}
            </p>
            <p className="text-[11px] text-emerald-700">
              {data.freePlanPaidOrders} orders · {data.freePlanStoresCount} free stores
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 sm:p-5 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Active Paid Subs</span>
              <Users className="w-4 h-4 text-[#2e1065]" />
            </div>
            <p className="font-mono text-xl sm:text-2xl font-extrabold text-[#0f172a]">
              {data.activePaidSubscriptionsCount}
            </p>
            <p className="text-[11px] text-slate-500">
              Currently active paid stores
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-4 sm:p-5 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-amber-800 font-semibold">
              <span>Expiring in ≤ 7 Days</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="font-mono text-xl sm:text-2xl font-extrabold text-amber-900">
              {data.expiringSoonCount}
            </p>
            <p className="text-[11px] text-amber-700">
              Auto-reminded at 3d &amp; 1d
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Paid Plan Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.paidPlanBreakdown.map((item) => (
          <Card key={item.tier} className="border-slate-200 bg-white">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2e1065]">
                  {item.name}
                </span>
                <Badge variant="secondary">{item.activeCount} active</Badge>
              </div>
              <p className="font-mono text-2xl font-extrabold text-[#0f172a]">
                {formatCurrency(item.totalPaid)}
              </p>
              <p className="text-xs text-slate-500">
                {item.paymentsCount} payments · {formatCurrency(item.monthlyPrice)}/mo
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tier Configuration Editor */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-[#2e1065]" />
            <span>Tier Pricing &amp; Feature Configuration</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Adjust monthly/annual pricing, product caps, and feature restrictions for each tier.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.plans.map((p) => {
            const draft = editingPlans[p.tier] || p;
            return (
              <div
                key={p.tier}
                className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm text-[#0f172a]">{draft.name}</p>
                    <p className="text-[11px] font-mono text-slate-500">{p.tier}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSavePlan(p.tier)}
                    disabled={savingTier === p.tier}
                    className="bg-[#2e1065] hover:bg-[#3b0764] text-white h-8 text-xs"
                  >
                    {savingTier === p.tier ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 mr-1" />
                        Save
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">
                      Monthly (₦)
                    </label>
                    <input
                      type="number"
                      value={draft.monthlyPrice}
                      onChange={(e) =>
                        setEditingPlans((prev) => ({
                          ...prev,
                          [p.tier]: { ...draft, monthlyPrice: Number(e.target.value) },
                        }))
                      }
                      className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">
                      Annual (₦)
                    </label>
                    <input
                      type="number"
                      value={draft.annualPrice}
                      onChange={(e) =>
                        setEditingPlans((prev) => ({
                          ...prev,
                          [p.tier]: { ...draft, annualPrice: Number(e.target.value) },
                        }))
                      }
                      className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">
                      Max Products
                    </label>
                    <input
                      type="number"
                      value={draft.maxProducts}
                      onChange={(e) =>
                        setEditingPlans((prev) => ({
                          ...prev,
                          [p.tier]: { ...draft, maxProducts: Number(e.target.value) },
                        }))
                      }
                      className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">
                      Max Images / Product
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={draft.maxImagesPerProduct}
                      onChange={(e) =>
                        setEditingPlans((prev) => ({
                          ...prev,
                          [p.tier]: {
                            ...draft,
                            maxImagesPerProduct: Number(e.target.value),
                          },
                        }))
                      }
                      className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600">
                      Platform Fee (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={draft.platformFeePercent}
                      onChange={(e) =>
                        setEditingPlans((prev) => ({
                          ...prev,
                          [p.tier]: {
                            ...draft,
                            platformFeePercent: Number(e.target.value),
                          },
                        }))
                      }
                      className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  {[
                    { key: "allowPassFee", label: "Pass Gateway Fee" },
                    { key: "allowPromoCodes", label: "Promo Codes" },
                    { key: "allowOfferBanner", label: "Offer Banner" },
                    { key: "allowCustomDomain", label: "Custom Domain" },
                  ].map((flag) => (
                    <label
                      key={flag.key}
                      className="flex items-center gap-1.5 cursor-pointer text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean((draft as any)[flag.key])}
                        onChange={(e) =>
                          setEditingPlans((prev) => ({
                            ...prev,
                            [p.tier]: { ...draft, [flag.key]: e.target.checked },
                          }))
                        }
                        className="rounded border-slate-300 text-[#2e1065]"
                      />
                      <span>{flag.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Store Accounts & Days Countdown */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">
                Store Accounts &amp; Subscription Countdown
              </CardTitle>
              <CardDescription className="text-xs">
                Track days remaining on every merchant account or manually grant/extend a plan.
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search store or owner..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#2e1065]"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: "ALL", label: "All Stores" },
              { id: "STARTER_PLUS", label: "Starter Plus" },
              { id: "PRO", label: "Deluxe (Pro)" },
              { id: "BUSINESS", label: "Ultimate" },
              { id: "STARTER", label: "Starter (Free)" },
              { id: "EXPIRING", label: "Expiring ≤ 7d" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTierFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
                  tierFilter === tab.id
                    ? "bg-[#2e1065] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {filteredStores.map((s) => (
              <div key={s.id} className="p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#0f172a] truncate">{s.name}</p>
                    <p className="text-[11px] font-mono text-slate-500 truncate">
                      {s.slug}.kredibly.shop
                    </p>
                  </div>
                  <CountdownBadge
                    tier={s.subscriptionTier}
                    daysRemaining={s.daysRemaining}
                    isInGracePeriod={s.isInGracePeriod}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>{TIER_LABELS[s.subscriptionTier]}</span>
                  <span className="font-mono font-bold text-[#0f172a]">
                    Paid: {formatCurrency(s.totalPaid)}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenManage(s)}
                  className="w-full h-8 text-xs"
                >
                  Manage Plan
                </Button>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50/70">
                  <th className="py-3 px-4 font-semibold">Store</th>
                  <th className="py-3 px-4 font-semibold">Owner</th>
                  <th className="py-3 px-4 font-semibold">Plan</th>
                  <th className="py-3 px-4 font-semibold">Countdown</th>
                  <th className="py-3 px-4 font-semibold">Total Paid</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStores.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <p className="font-bold text-[#0f172a]">{s.name}</p>
                      <p className="text-[11px] font-mono text-slate-500">
                        {s.slug}.kredibly.shop · {s.productCount} products
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#0f172a]">{s.ownerName}</p>
                      <p className="text-[11px] text-slate-500">{s.ownerEmail}</p>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#2e1065]">
                      {TIER_LABELS[s.subscriptionTier]}
                    </td>
                    <td className="py-3 px-4">
                      <CountdownBadge
                        tier={s.subscriptionTier}
                        daysRemaining={s.daysRemaining}
                        isInGracePeriod={s.isInGracePeriod}
                      />
                      {s.subscriptionEnd && s.subscriptionTier !== "STARTER" && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Ends {new Date(s.subscriptionEnd).toLocaleDateString("en-NG")}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#0f172a]">
                      {formatCurrency(s.totalPaid)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenManage(s)}
                        className="h-8 text-xs"
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Manage Store Subscription Modal */}
      <Dialog open={Boolean(manageStore)} onOpenChange={(v) => !v && setManageStore(null)}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Manage Subscription — {manageStore?.name}</DialogTitle>
            <DialogDescription>
              Upgrade, extend, or downgrade this store&apos;s plan manually.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGrantSubscription} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                Plan Tier
              </label>
              <select
                value={grantTier}
                onChange={(e) => setGrantTier(e.target.value as TierKey)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
              >
                <option value="STARTER">Starter (Free)</option>
                <option value="STARTER_PLUS">Starter Plus (₦5,000/mo)</option>
                <option value="PRO">Deluxe (Pro — ₦10,000/mo)</option>
                <option value="BUSINESS">Ultimate (Scale — ₦20,000/mo)</option>
              </select>
            </div>

            {grantTier !== "STARTER" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={3650}
                    value={grantDays}
                    onChange={(e) => setGrantDays(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                    Amount Recorded (₦)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={grantAmount}
                    onChange={(e) => setGrantAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setManageStore(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={grantSaving}
                className="bg-[#2e1065] hover:bg-[#3b0764] text-white"
              >
                {grantSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply Plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
