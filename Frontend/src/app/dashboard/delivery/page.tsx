"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatCurrency, formatNumberInput, parseNumberInput } from "@/lib/utils";
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
  RotateCcw,
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

const PROMOS_ENABLED = false;

const DEFAULT_SHIPPING: ShippingConfig = {
  defaultFee: 0,
  freeDeliveryEnabled: false,
  freeDeliveryScope: "ALL",
  freeDeliveryStates: [],
  freeDeliveryMinOrder: null,
  stateRates: {},
  offerBannerEnabled: false,
  offerBannerText: "",
  offerBannerExpiresAt: null,
};

export default function DeliveryAndPromosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingShipping, setSavingShipping] = useState(false);

  const [shipping, setShipping] = useState<ShippingConfig>(DEFAULT_SHIPPING);
  const [initialShipping, setInitialShipping] =
    useState<ShippingConfig>(DEFAULT_SHIPPING);
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
          const loaded: ShippingConfig = {
            defaultFee: Number(cfg.defaultFee || 0),
            freeDeliveryEnabled: Boolean(cfg.freeDeliveryEnabled),
            freeDeliveryScope: cfg.freeDeliveryScope || "ALL",
            freeDeliveryStates: Array.isArray(cfg.freeDeliveryStates)
              ? cfg.freeDeliveryStates
              : [],
            freeDeliveryMinOrder: cfg.freeDeliveryMinOrder ?? null,
            stateRates: cfg.stateRates || {},
            offerBannerEnabled: Boolean(cfg.offerBannerEnabled),
            offerBannerText: cfg.offerBannerText || "",
            offerBannerExpiresAt: cfg.offerBannerExpiresAt || null,
          };
          setShipping(loaded);
          setInitialShipping(loaded);
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

  const hasShippingChanges =
    JSON.stringify(shipping) !== JSON.stringify(initialShipping);

  const handleSaveShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingShipping(true);
    try {
      await api.put("/store/settings", {
        shippingConfig: shipping,
      });
      setInitialShipping(shipping);
      toast.success("Delivery settings saved!");
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to save delivery settings."
      );
    } finally {
      setSavingShipping(false);
    }
  };

  const handleDiscardShipping = () => {
    setShipping(initialShipping);
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
    const fee = parseNumberInput(newStateFee);
    if (!newStateName || !newStateFee.trim() || Number.isNaN(fee) || fee < 0) {
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

  const parsedDiscountValue =
    discountType === "PERCENTAGE"
      ? Number(discountValue)
      : parseNumberInput(discountValue);
  const isPromoValid =
    promoCode.trim().length >= 3 &&
    parsedDiscountValue >= 1 &&
    (discountType !== "PERCENTAGE" || parsedDiscountValue <= 100);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPromoValid) return;
    setCreatingPromo(true);
    try {
      const res = await api.post("/store/promos", {
        code: promoCode.trim().toUpperCase(),
        discountType,
        discountValue: parsedDiscountValue,
        minOrderAmount: minOrderAmount ? parseNumberInput(minOrderAmount) : null,
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
          Delivery &amp; Offers
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Announce exclusive store offers at the top of your storefront and set delivery rates.
        </p>
      </div>

      {/* 1. Exclusive Offer Banner (Separate Card Above Delivery Rates) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#2e1065]/10 flex items-center justify-center text-[#2e1065]">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>Exclusive Offer Banner (Top of Storefront)</CardTitle>
              <CardDescription>
                Pin a custom announcement bar right above your storefront header so every visitor sees it first.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveShipping} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#fafaf8] border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <p className="font-bold text-[#0f172a]">How to use this effectively:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong>Turn on the toggle</strong> and write any offer in your own words (e.g. a weekend promo, free gift above a certain order amount, or same-day dispatch cutoff).
                </li>
                <li>
                  <strong>Stays visible everywhere:</strong> It stays pinned above your store&apos;s header as shoppers browse.
                </li>
                <li>
                  <strong>Optional end date:</strong> Set an expiry date if it&apos;s a limited-time promo — it will hide automatically once that date passes.
                </li>
              </ul>
            </div>

            <label className="flex items-center justify-between cursor-pointer gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <p className="text-xs font-bold text-[#0f172a]">
                  Show Exclusive Offer Banner on Storefront
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Overrides the default free-delivery bar when turned on.
                </p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(shipping.offerBannerEnabled)}
                onChange={(e) =>
                  setShipping({
                    ...shipping,
                    offerBannerEnabled: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-[#2e1065] cursor-pointer shrink-0"
              />
            </label>

            {shipping.offerBannerEnabled && (
              <div className="space-y-3.5 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[#0f172a]">
                      Your Offer / Announcement Text
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {(shipping.offerBannerText || "").length}/120
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={120}
                    placeholder="e.g. Free gift on every order above ₦30,000 this weekend"
                    value={shipping.offerBannerText || ""}
                    onChange={(e) =>
                      setShipping({
                        ...shipping,
                        offerBannerText: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#2e1065]"
                  />
                </div>

                {/* Optional Quick-Fill Starters */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-500">Quick ideas:</span>
                  {[
                    "Same-day Lagos dispatch for orders before 2 PM",
                    "Free gift on all orders above ₦30,000",
                    "Weekend Flash Sale — limited stock available!",
                    "Buy 2 items & get a free surprise bonus",
                  ].map((idea) => (
                    <button
                      key={idea}
                      type="button"
                      onClick={() =>
                        setShipping({ ...shipping, offerBannerText: idea })
                      }
                      className="px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 hover:border-[#2e1065] text-[11px] text-slate-600 transition cursor-pointer"
                    >
                      {idea}
                    </button>
                  ))}
                </div>

                <div className="max-w-xs">
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">
                    Auto-Hide After Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={shipping.offerBannerExpiresAt || ""}
                    onChange={(e) =>
                      setShipping({
                        ...shipping,
                        offerBannerExpiresAt: e.target.value || null,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-[#0f172a]"
                  />
                </div>

                {shipping.offerBannerText?.trim() && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Storefront Preview
                    </span>
                    <div className="w-full rounded-lg bg-[#2e1065] text-white text-center py-2 px-3 text-[11px] sm:text-xs font-semibold tracking-wide">
                      {shipping.offerBannerText.trim()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {hasShippingChanges && (
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                <p className="text-xs font-medium text-slate-600">
                  You have unsaved changes.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDiscardShipping}
                    disabled={savingShipping}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Discard</span>
                  </Button>
                  <Button type="submit" size="sm" disabled={savingShipping}>
                    {savingShipping ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Save Changes</span>
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* 2. Delivery Rates & Free Delivery */}
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
                type="text"
                inputMode="numeric"
                value={formatNumberInput(shipping.defaultFee)}
                onChange={(e) =>
                  setShipping({
                    ...shipping,
                    defaultFee: parseNumberInput(e.target.value),
                  })
                }
                placeholder="e.g. 3,500"
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
                  type="text"
                  inputMode="numeric"
                  placeholder="Fee (₦)"
                  value={newStateFee}
                  onChange={(e) =>
                    setNewStateFee(formatNumberInput(e.target.value))
                  }
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

            {hasShippingChanges && (
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                <p className="text-xs font-medium text-slate-600">
                  You have unsaved changes.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDiscardShipping}
                    disabled={savingShipping}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Discard</span>
                  </Button>
                  <Button type="submit" size="sm" disabled={savingShipping}>
                    {savingShipping ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Save Changes</span>
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* 2. Promo / Discount Codes */}
      {!PROMOS_ENABLED ? (
        <Card className="border-dashed border-slate-300 bg-slate-50/70">
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-200/70 flex items-center justify-center text-slate-600">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    Promo &amp; Discount Codes
                  </CardTitle>
                  <CardDescription>
                    Create coupon codes shoppers can apply at checkout.
                  </CardDescription>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#2e1065]/10 text-[#2e1065] text-[11px] font-bold uppercase tracking-wider">
                Upcoming Update
              </span>
            </div>
          </CardHeader>
        </Card>
      ) : (
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
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder={discountType === "PERCENTAGE" ? "10" : "2,000"}
                  value={discountValue}
                  onChange={(e) => {
                    if (discountType === "PERCENTAGE") {
                      const digits = e.target.value.replace(/\D/g, "");
                      setDiscountValue(digits ? String(Math.min(100, Number(digits))) : "");
                    } else {
                      setDiscountValue(formatNumberInput(e.target.value));
                    }
                  }}
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
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 10,000"
                  value={minOrderAmount}
                  onChange={(e) =>
                    setMinOrderAmount(formatNumberInput(e.target.value))
                  }
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
              <Button
                type="submit"
                size="sm"
                disabled={creatingPromo || !isPromoValid}
              >
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
      )}
    </div>
  );
}
