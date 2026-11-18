"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { ShippingConfig } from "@/types/storefront";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Truck,
  Tag,
  Plus,
  Trash2,
  Loader2,
  Save,
  X,
} from "lucide-react";

const NIGERIAN_STATES = [
  "Lagos",
  "Abuja FCT",
  "Rivers",
  "Oyo",
  "Ogun",
  "Kano",
  "Enugu",
  "Edo",
  "Delta",
  "Kaduna",
  "Anambra",
  "Cross River",
  "Akwa Ibom",
  "Abia",
  "Adamawa",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Ebonyi",
  "Ekiti",
  "Gombe",
  "Imo",
  "Jigawa",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Nasarawa",
  "Niger",
  "Ondo",
  "Osun",
  "Plateau",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

interface PromoCode {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number | string;
  minOrderAmount?: number | string | null;
  maxUses?: number | null;
  usedCount: number;
  expiresAt?: string | null;
  isActive: boolean;
}

const DEFAULT_SHIPPING: ShippingConfig = {
  defaultFee: 0,
  freeDeliveryEnabled: false,
  freeDeliveryScope: "ALL",
  freeDeliveryStates: [],
  freeDeliveryMinOrder: null,
  stateRates: {},
};

export default function DeliveryAndPromosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingShipping, setSavingShipping] = useState(false);

  const [shipping, setShipping] = useState<ShippingConfig>(DEFAULT_SHIPPING);
  const [newStateName, setNewStateName] = useState("Lagos");
  const [newStateFee, setNewStateFee] = useState("");

  // Promo state
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [creatingPromo, setCreatingPromo] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">(
    "PERCENTAGE"
  );
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [settingsRes, promosRes] = await Promise.all([
          api.get("/store/settings"),
          api.get("/store/promos"),
        ]);

        const cfg = settingsRes.data.data?.shippingConfig;
        if (cfg && typeof cfg === "object") {
          setShipping({
            defaultFee: Number(cfg.defaultFee || 0),
            freeDeliveryEnabled: Boolean(cfg.freeDeliveryEnabled),
            freeDeliveryScope: cfg.freeDeliveryScope || "ALL",
            freeDeliveryStates: Array.isArray(cfg.freeDeliveryStates)
              ? cfg.freeDeliveryStates
              : [],
            freeDeliveryMinOrder: cfg.freeDeliveryMinOrder ?? null,
            stateRates: cfg.stateRates || {},
          });
        }

        setPromos(promosRes.data.data || []);
      } catch (err: any) {
        if (err.response?.status === 401) {
          router.push("/login");
        } else {
          toast.error("Failed to load delivery & promo settings.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [router]);

  const handleSaveShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingShipping(true);
    try {
      await api.put("/store/settings", {
        shippingConfig: shipping,
      });
      toast.success("Delivery rates saved!");
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to save delivery settings."
      );
    } finally {
      setSavingShipping(false);
    }
  };

  const toggleFreeState = (st: string) => {
    setShipping((prev) => {
      const exists = prev.freeDeliveryStates.includes(st);
      return {
        ...prev,
        freeDeliveryStates: exists
          ? prev.freeDeliveryStates.filter((s) => s !== st)
          : [...prev.freeDeliveryStates, st],
      };
    });
  };

  const handleAddStateRate = () => {
    const fee = Number(newStateFee);
    if (!newStateName || Number.isNaN(fee) || fee < 0) {
      toast.error("Enter a valid delivery fee.");
      return;
    }
    setShipping((prev) => ({
      ...prev,
      stateRates: { ...prev.stateRates, [newStateName]: fee },
    }));
    setNewStateFee("");
  };

  const handleRemoveStateRate = (st: string) => {
    setShipping((prev) => {
      const next = { ...prev.stateRates };
      delete next[st];
      return { ...prev, stateRates: next };
    });
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingPromo(true);
    try {
      const res = await api.post("/store/promos", {
        code: promoCode.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null,
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt || null,
      });
      setPromos((prev) => [res.data.data, ...prev]);
      setPromoCode("");
      setDiscountValue("");
      setMinOrderAmount("");
      setMaxUses("");
      setExpiresAt("");
      toast.success("Promo code created!");
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to create promo code."
      );
    } finally {
      setCreatingPromo(false);
    }
  };

  const handleTogglePromo = async (promo: PromoCode) => {
    try {
      const res = await api.patch(`/store/promos/${promo.id}`, {
        isActive: !promo.isActive,
      });
      setPromos((prev) =>
        prev.map((p) => (p.id === promo.id ? res.data.data : p))
      );
    } catch {
      toast.error("Failed to update promo code.");
    }
  };

  const handleDeletePromo = async (id: string) => {
    try {
      await api.delete(`/store/promos/${id}`);
      setPromos((prev) => prev.filter((p) => p.id !== id));
      toast.success("Promo code deleted.");
    } catch {
      toast.error("Failed to delete promo code.");
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#2e1065]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a] tracking-tight">
          Delivery &amp; Promos
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Set state delivery fees, promote free delivery, and create checkout discount codes.
        </p>
      </div>

      {/* 1. Delivery Rates & Free Delivery */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[#0f172a]">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>State Delivery Rates</CardTitle>
              <CardDescription>
                Set a default fee, customize individual states, or offer free delivery to boost sales.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveShipping} className="space-y-6">
            {/* Default Fee */}
            <div className="max-w-xs">
              <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">
                Default Delivery Fee (All Other States, ₦)
              </label>
              <input
                type="number"
                min={0}
                value={shipping.defaultFee}
                onChange={(e) =>
                  setShipping({
                    ...shipping,
                    defaultFee: Number(e.target.value || 0),
                  })
                }
                placeholder="e.g. 3500"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-sm text-[#0f172a] focus:outline-none focus:border-[#2e1065]"
              />
            </div>

            {/* Free Delivery Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <label className="flex items-center justify-between cursor-pointer gap-4">
                <div>
                  <p className="text-xs font-bold text-[#0f172a]">
                    Offer Free Delivery
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Automatically promotes free delivery in your storefront banner and checkout.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={shipping.freeDeliveryEnabled}
                  onChange={(e) =>
                    setShipping({
                      ...shipping,
                      freeDeliveryEnabled: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-[#2e1065] cursor-pointer shrink-0"
                />
              </label>

              {shipping.freeDeliveryEnabled && (
                <div className="pt-3 border-t border-slate-200 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setShipping({ ...shipping, freeDeliveryScope: "ALL" })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        shipping.freeDeliveryScope === "ALL"
                          ? "bg-[#2e1065] border-[#2e1065] text-white"
                          : "bg-white border-slate-200 text-slate-700"
                      }`}
                    >
                      All States (Nationwide)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setShipping({
                          ...shipping,
                          freeDeliveryScope: "SELECTED",
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        shipping.freeDeliveryScope === "SELECTED"
                          ? "bg-[#2e1065] border-[#2e1065] text-white"
                          : "bg-white border-slate-200 text-slate-700"
                      }`}
                    >
                      Selected States Only
                    </button>
                  </div>

                  {shipping.freeDeliveryScope === "SELECTED" && (
                    <div>
                      <p className="text-[11px] font-semibold text-slate-600 mb-2">
                        Tap states where delivery should be FREE:
                      </p>
                      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2.5 bg-white rounded-xl border border-slate-200">
                        {NIGERIAN_STATES.map((st) => {
                          const active =
                            shipping.freeDeliveryStates.includes(st);
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => toggleFreeState(st)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition cursor-pointer ${
                                active
                                  ? "bg-[#2e1065] border-[#2e1065] text-white"
                                  : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              {st}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="max-w-xs">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Minimum Order for Free Delivery (₦, Optional)
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="Leave blank for any order"
                      value={shipping.freeDeliveryMinOrder ?? ""}
                      onChange={(e) =>
                        setShipping({
                          ...shipping,
                          freeDeliveryMinOrder: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-[#0f172a] focus:outline-none focus:border-[#2e1065]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Custom State Rates */}
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-[#0f172a]">
                  Custom State Rates (Optional)
                </p>
                <p className="text-[11px] text-slate-500">
                  Override the default fee for specific states (e.g. Lagos ₦2,000).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={newStateName}
                  onChange={(e) => setNewStateName(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#0f172a]"
                >
                  {NIGERIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  placeholder="Fee (₦)"
                  value={newStateFee}
                  onChange={(e) => setNewStateFee(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#0f172a] w-full sm:w-36"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddStateRate}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add State Rate</span>
                </Button>
              </div>

              {Object.keys(shipping.stateRates).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.entries(shipping.stateRates).map(([st, fee]) => (
                    <span
                      key={st}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-[#0f172a]"
                    >
                      <span>
                        {st}: {formatCurrency(fee)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveStateRate(st)}
                        className="text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" disabled={savingShipping}>
                {savingShipping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save Delivery Settings</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 2. Promo / Discount Codes */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[#0f172a]">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>Promo &amp; Discount Codes</CardTitle>
              <CardDescription>
                Create coupon codes shoppers can apply at checkout.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            onSubmit={handleCreatePromo}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WELCOME10"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono uppercase text-[#0f172a]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Discount Type *
                </label>
                <select
                  value={discountType}
                  onChange={(e) =>
                    setDiscountType(e.target.value as "PERCENTAGE" | "FIXED")
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-[#0f172a]"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₦)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {discountType === "PERCENTAGE" ? "Percent (%) *" : "Amount (₦) *"}
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={discountType === "PERCENTAGE" ? 100 : undefined}
                  placeholder={discountType === "PERCENTAGE" ? "10" : "2000"}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-[#0f172a]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Min Order (₦, Optional)
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="e.g. 10000"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-[#0f172a]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Max Uses (Optional)
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-[#0f172a]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Expires On (Optional)
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-[#0f172a]"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={creatingPromo}>
                {creatingPromo ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Create Promo Code</span>
              </Button>
            </div>
          </form>

          {promos.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              No promo codes created yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
              {promos.map((p) => (
                <div
                  key={p.id}
                  className="px-4 py-3 flex items-center justify-between gap-3 bg-white"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#0f172a]">
                        {p.code}
                      </span>
                      <span className="text-[11px] font-semibold text-[#2e1065] bg-[#2e1065]/10 px-2 py-0.5 rounded">
                        {p.discountType === "PERCENTAGE"
                          ? `${Number(p.discountValue)}% OFF`
                          : `${formatCurrency(p.discountValue)} OFF`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Used {p.usedCount}
                      {p.maxUses ? ` / ${p.maxUses}` : ""} times
                      {p.minOrderAmount
                        ? ` • Min ${formatCurrency(p.minOrderAmount)}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={p.isActive}
                        onChange={() => handleTogglePromo(p)}
                        className="accent-[#2e1065] cursor-pointer"
                      />
                      <span>{p.isActive ? "Active" : "Paused"}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeletePromo(p.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
