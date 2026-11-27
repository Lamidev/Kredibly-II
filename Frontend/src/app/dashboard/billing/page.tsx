"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check,
  CreditCard,
  Loader2,
  Wallet,
  Clock,
} from "lucide-react";

type TierKey = "STARTER" | "STARTER_PLUS" | "PRO" | "BUSINESS";

interface PlanItem {
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
}

interface BillingOverview {
  currentTier: TierKey;
  subscriptionEnd: string | null;
  daysRemaining: number | null;
  isInGracePeriod: boolean;
  productCount: number;
  walletAvailableBalance: number;
  plans: PlanItem[];
  payments: Array<{
    id: string;
    tier: TierKey;
    billingCycle: string;
    amount: number;
    paymentMethod: string;
    reference: string;
    periodEnd: string;
    createdAt: string;
  }>;
}

declare global {
  interface Window {
    PaystackPop?: new () => {
      resumeTransaction: (
        accessCode: string,
        callbacks?: {
          onSuccess?: (transaction: { reference?: string }) => void;
          onCancel?: () => void;
          onError?: (error: { message?: string }) => void;
        }
      ) => void;
    };
  }
}

function loadPaystackInlineScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.PaystackPop) return resolve(true);

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://js.paystack.co/v2/inline.js"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.PaystackPop)), {
        once: true,
      });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v2/inline.js";
    script.async = true;
    script.onload = () => resolve(Boolean(window.PaystackPop));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

function formatPaymentMethodLabel(method: string): string {
  switch (method) {
    case "PAYSTACK_CHECKOUT":
      return "Paystack Checkout";
    case "WALLET":
      return "Kredibly Wallet";
    case "NOMBA_TRANSFER":
      return "Bank Transfer";
    case "ADMIN_GRANT":
      return "Admin Grant";
    default:
      return method;
  }
}

export default function MerchantBillingPage() {
  const { updateStore } = useAuthStore();
  const [data, setData] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [processingTier, setProcessingTier] = useState<string | null>(null);
  const [verifyingRef, setVerifyingRef] = useState(false);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await api.get("/subscription/overview");
      setData(res.data.data);
    } catch {
      toast.error("Failed to load subscription plans.");
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyCheckoutReference = useCallback(
    async (reference: string, cycle: "MONTHLY" | "ANNUAL" = "MONTHLY") => {
      setVerifyingRef(true);
      try {
        const res = await api.post("/subscription/verify-transfer", {
          reference,
        });
        toast.success(res.data?.message || "Payment confirmed and plan activated!");
        if (res.data?.data?.tier) {
          trackEvent("paid_plan_upgraded", {
            tier: res.data.data.tier,
            method: "paystack_checkout",
            billing_cycle: cycle,
          });
          updateStore({ subscriptionTier: res.data.data.tier });
        }
        await fetchOverview();
      } catch (err: any) {
        toast.error(
          err.response?.data?.message ||
            "Payment is still confirming. Please refresh in a few seconds."
        );
      } finally {
        setVerifyingRef(false);
      }
    },
    [fetchOverview, updateStore]
  );

  useEffect(() => {
    fetchOverview();
    loadPaystackInlineScript();

    // Handle fallback redirect callback (?sub_ref=... or ?reference=...)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("sub_ref") || params.get("reference") || params.get("trxref");
      if (ref && ref.startsWith("SUB-")) {
        window.history.replaceState({}, "", window.location.pathname);
        verifyCheckoutReference(ref);
      }
    }
  }, [fetchOverview, verifyCheckoutReference]);

  const handleWalletUpgrade = async (tier: TierKey) => {
    if (tier === "STARTER") return;
    setProcessingTier(`${tier}-wallet`);
    try {
      const res = await api.post("/subscription/upgrade-wallet", {
        tier,
        billingCycle,
      });
      toast.success(res.data?.message || "Plan upgraded!");
      trackEvent("paid_plan_upgraded", {
        tier,
        method: "wallet",
        billing_cycle: billingCycle,
      });
      updateStore({ subscriptionTier: tier });
      await fetchOverview();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not upgrade via wallet.");
    } finally {
      setProcessingTier(null);
    }
  };

  const handlePaystackUpgrade = async (tier: TierKey) => {
    if (tier === "STARTER") return;
    setProcessingTier(`${tier}-paystack`);
    try {
      const [res, inlineReady] = await Promise.all([
        api.post("/subscription/upgrade-checkout", {
          tier,
          billingCycle,
        }),
        loadPaystackInlineScript(),
      ]);

      const { accessCode, authorizationUrl, reference } = res.data.data as {
        accessCode: string;
        authorizationUrl: string;
        reference: string;
      };

      trackEvent("paid_plan_checkout_started", {
        tier,
        method: "paystack_checkout",
        billing_cycle: billingCycle,
      });

      if (inlineReady && window.PaystackPop && accessCode) {
        const popup = new window.PaystackPop();
        popup.resumeTransaction(accessCode, {
          onSuccess: (tx) => {
            verifyCheckoutReference(tx?.reference || reference, billingCycle);
          },
          onCancel: () => {
            toast.info("Checkout closed. You can complete your upgrade anytime.");
          },
          onError: (err) => {
            toast.error(err?.message || "Paystack checkout encountered an error.");
          },
        });
      } else if (authorizationUrl) {
        // Fallback to hosted checkout if inline script is blocked by browser extensions
        window.location.href = authorizationUrl;
      } else {
        toast.error("Could not launch Paystack checkout.");
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Could not initialize Paystack checkout."
      );
    } finally {
      setProcessingTier(null);
    }
  };

  if (loading || !data) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#2e1065]" />
      </div>
    );
  }

  const activePlan = data.plans.find((p) => p.tier === data.currentTier) || data.plans[0];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#0f172a]">
            Billing &amp; Plans
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your Kredibly plan, product limits, and renewal schedule.
          </p>
        </div>

        <div className="inline-flex items-center p-1 rounded-xl bg-white border border-slate-200 self-start">
          <button
            type="button"
            onClick={() => setBillingCycle("MONTHLY")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
              billingCycle === "MONTHLY"
                ? "bg-[#2e1065] text-white"
                : "text-slate-600 hover:text-[#0f172a]"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("ANNUAL")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
              billingCycle === "ANNUAL"
                ? "bg-[#2e1065] text-white"
                : "text-slate-600 hover:text-[#0f172a]"
            }`}
          >
            Annual (2 Months Free)
          </button>
        </div>
      </div>

      {verifyingRef && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          Confirming your Paystack payment and activating your plan...
        </div>
      )}

      {/* Current Plan Summary */}
      <Card className="border-slate-200 bg-white">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2e1065]">
                Current Plan
              </span>
              <Badge variant={data.currentTier === "STARTER" ? "secondary" : "success"}>
                {activePlan.name}
              </Badge>
              {data.daysRemaining !== null && data.currentTier !== "STARTER" && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" />
                  {data.daysRemaining <= 0
                    ? data.isInGracePeriod
                      ? "Grace period — renew soon"
                      : "Expired"
                    : `${data.daysRemaining} days left`}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600">
              Products used:{" "}
              <strong className="font-mono text-[#0f172a]">
                {data.productCount} / {activePlan.maxProducts >= 2000 ? "1,000+" : activePlan.maxProducts}
              </strong>{" "}
              · Platform fee:{" "}
              <strong className="font-mono text-[#0f172a]">
                {activePlan.platformFeePercent}%
              </strong>
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-[11px] text-slate-500">Available Wallet Balance</p>
            <p className="font-mono text-lg font-extrabold text-[#2e1065]">
              {formatCurrency(data.walletAvailableBalance)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {data.plans.map((plan) => {
          const price =
            billingCycle === "ANNUAL" ? plan.annualPrice : plan.monthlyPrice;
          const isCurrent = data.currentTier === plan.tier;
          const canAffordWallet = data.walletAvailableBalance >= price;

          const features = [
            `Up to ${plan.maxProducts >= 2000 ? "1,000+" : plan.maxProducts} products`,
            `Up to ${plan.maxImagesPerProduct} images per product`,
            plan.platformFeePercent === 0
              ? "0% Kredibly commission"
              : `${plan.platformFeePercent}% transaction fee`,
            ...(plan.allowPassFee ? ["Pass payment fee to buyer"] : []),
            ...(plan.allowPromoCodes ? ["Discount & promo codes"] : []),
            ...(plan.allowOfferBanner ? ["Exclusive storefront banner"] : []),
            ...(plan.allowCustomDomain ? ["Free .com.ng domain (annual)"] : []),
          ];

          return (
            <Card
              key={plan.tier}
              className={`flex flex-col justify-between bg-white ${
                plan.tier === "PRO"
                  ? "border-[#2e1065] ring-1 ring-[#2e1065]/20"
                  : "border-slate-200"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  {plan.tier === "PRO" && (
                    <span className="px-2 py-0.5 rounded-full bg-[#2e1065] text-white text-[10px] font-bold uppercase tracking-wider">
                      Popular
                    </span>
                  )}
                </div>
                <CardDescription className="text-xs min-h-[34px]">
                  {plan.tagline}
                </CardDescription>
                <div className="pt-2">
                  <span className="font-mono text-2xl font-extrabold text-[#0f172a]">
                    {formatCurrency(price)}
                  </span>
                  {price > 0 && (
                    <span className="text-xs text-slate-500">
                      /{billingCycle === "ANNUAL" ? "year" : "month"}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                <ul className="space-y-2 text-xs text-slate-600">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {plan.tier === "STARTER" ? (
                  <Button disabled variant="outline" className="w-full text-xs">
                    {isCurrent ? "Current Plan" : "Default Free Plan"}
                  </Button>
                ) : (
                  <div className="space-y-2 pt-2">
                    <Button
                      type="button"
                      disabled={processingTier !== null || verifyingRef}
                      onClick={() => handlePaystackUpgrade(plan.tier)}
                      className="w-full bg-[#2e1065] hover:bg-[#3b0764] text-white text-xs"
                    >
                      {processingTier === `${plan.tier}-paystack` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                          {isCurrent ? "Renew with Paystack" : "Pay with Paystack"}
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!canAffordWallet || processingTier !== null || verifyingRef}
                      onClick={() => handleWalletUpgrade(plan.tier)}
                      className="w-full text-xs"
                    >
                      {processingTier === `${plan.tier}-wallet` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Wallet className="w-3.5 h-3.5 mr-1.5" />
                          {isCurrent ? "Renew from Wallet" : "Pay from Wallet"}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment History */}
      {data.payments.length > 0 && (
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-base">Billing History</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100">
            {data.payments.map((p) => (
              <div
                key={p.id}
                className="py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-[#0f172a]">
                    {p.tier} ({p.billingCycle})
                  </p>
                  <p className="text-[11px] font-mono text-slate-500">
                    {p.reference} · {formatPaymentMethodLabel(p.paymentMethod)} ·{" "}
                    {new Date(p.createdAt).toLocaleDateString("en-NG")}
                  </p>
                </div>
                <span className="font-mono font-bold text-[#2e1065]">
                  {formatCurrency(p.amount)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
