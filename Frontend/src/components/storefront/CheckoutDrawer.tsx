"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { useShopperStore } from "@/store/useShopperStore";
import { api } from "@/lib/api";
import { formatCurrency, getImageUrl, getStorePath } from "@/lib/utils";
import {
  ShippingConfig,
  calculateClientShippingFee,
} from "@/types/storefront";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CreditCard,
  Landmark,
  Copy,
  Check,
  CheckCircle2,
  Truck,
  ChevronRight,
  ShoppingBag,
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

const PROMOS_ENABLED = false;

interface CheckoutDrawerProps {
  storeSlug: string;
  shippingConfig?: ShippingConfig | null;
  isOpen: boolean;
  onClose: () => void;
}

interface VirtualAccountState {
  accountNumber: string;
  bankName: string;
  accountName: string;
  reference: string;
  expiresAt: string;
  orderNumber: string;
  totalAmount: number;
}

export function CheckoutDrawer({
  storeSlug,
  shippingConfig,
  isOpen,
  onClose,
}: CheckoutDrawerProps) {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const {
    token: shopperToken,
    customer: shopperProfile,
    storeSlug: shopperStoreSlug,
    loadShopper,
    updateShopperProfile,
  } = useShopperStore();
  const subtotal = getSubtotal();

  const [step, setStep] = useState<1 | 2>(1);
  const [editingAddress, setEditingAddress] = useState(true);

  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");

  const [paymentMethod] = useState<"BANK_TRANSFER">("BANK_TRANSFER");

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    address: "",
    state: "Lagos",
    city: "",
    notes: "",
  });

  const shippingFee = calculateClientShippingFee(
    shippingConfig,
    formData.state,
    subtotal
  );
  const discountAmount = appliedPromo ? appliedPromo.discountAmount : 0;
  const totalDue = Math.max(0, subtotal - discountAmount) + shippingFee;

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  const [transferDetails, setTransferDetails] =
    useState<VirtualAccountState | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [checkingNow, setCheckingNow] = useState(false);
  const [checkStatusMsg, setCheckStatusMsg] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(30 * 60);

  // 30-minute countdown timer for DVA transfer
  useEffect(() => {
    if (!transferDetails || paymentConfirmed) return;
    setSecondsLeft(30 * 60);
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [transferDetails, paymentConfirmed]);

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
  };

  // Sync saved shopper profile into checkout form
  useEffect(() => {
    if (!isOpen) return;
    if (shopperStoreSlug !== storeSlug) {
      loadShopper(storeSlug);
    } else if (shopperProfile) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || shopperProfile.fullName || "",
        phoneNumber: prev.phoneNumber || shopperProfile.phoneNumber || "",
        email: prev.email || shopperProfile.email || "",
        address: prev.address || shopperProfile.address || "",
        state: shopperProfile.state || prev.state || "Lagos",
        city: prev.city || shopperProfile.city || "",
      }));
      if (shopperProfile.address) {
        setEditingAddress(false);
      }
    }
  }, [isOpen, storeSlug, shopperStoreSlug, shopperProfile, loadShopper]);

  // Poll for Bank Transfer completion
  useEffect(() => {
    if (!transferDetails || paymentConfirmed) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(
          `/checkout/orders/${transferDetails.orderNumber}`
        );
        if (res.data.data?.paymentStatus === "PAID") {
          setPaymentConfirmed(true);
          clearInterval(interval);
          setTimeout(() => {
            onClose();
            router.push(
              getStorePath(storeSlug, `/orders/${transferDetails.orderNumber}`)
            );
          }, 1200);
        }
      } catch {
        // silent poll
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [transferDetails, paymentConfirmed, router, storeSlug, onClose]);

  if (!isOpen) return null;

  const hasValidStep1 =
    formData.address.trim().length >= 5 &&
    formData.fullName.trim().length >= 2 &&
    formData.phoneNumber.trim().length >= 10 &&
    formData.state.trim().length >= 2;

  const handleContinueToPayment = () => {
    setErrorMsg("");
    if (!hasValidStep1) {
      setEditingAddress(true);
      setErrorMsg("Please fill in your delivery address, name, and phone number.");
      return;
    }
    setStep(2);
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await api.post("/checkout/validate-promo", {
        storeSlug,
        code: promoInput.trim(),
        subtotal,
      });
      setAppliedPromo({
        code: res.data.data.code,
        discountAmount: Number(res.data.data.discountAmount),
      });
    } catch (err: any) {
      setAppliedPromo(null);
      setPromoError(
        err.response?.data?.message || "Invalid or expired promo code."
      );
    } finally {
      setPromoLoading(false);
    }
  };

  const handleInitializeOrder = async () => {
    setErrorMsg("");
    setLoading(true);
    try {
      const payload = {
        storeSlug,
        customer: {
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          email: formData.email || undefined,
          address: formData.address,
          state: formData.state,
          city: formData.city || undefined,
        },
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        notes: formData.notes || undefined,
        promoCode: appliedPromo?.code || undefined,
        paymentMethod,
      };

      const res = await api.post("/checkout/initialize", payload);
      const data = res.data.data;

      if (
        shopperToken &&
        shopperStoreSlug === storeSlug &&
        shopperProfile &&
        !shopperProfile.address &&
        formData.address.trim()
      ) {
        api
          .put(
            "/shopper/address",
            {
              address: formData.address.trim(),
              state: formData.state,
              city: formData.city?.trim() || null,
            },
            { headers: { Authorization: `Bearer ${shopperToken}` } }
          )
          .then(() => {
            updateShopperProfile(storeSlug, {
              address: formData.address.trim(),
              state: formData.state,
              city: formData.city?.trim() || null,
            });
          })
          .catch(() => {});
      }

      clearCart();

      if (data.paymentMethod === "BANK_TRANSFER" && data.virtualAccount) {
        setTransferDetails({
          ...data.virtualAccount,
          orderNumber: data.orderNumber,
          totalAmount: data.totalAmount,
        });
        setLoading(false);
      } else if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
          "Failed to initialize checkout. Please check your details."
      );
      setLoading(false);
    }
  };

  const handleCheckPaymentNow = async () => {
    if (!transferDetails || checkingNow) return;
    setCheckingNow(true);
    setCheckStatusMsg("");
    try {
      const res = await api.get(
        `/checkout/orders/${transferDetails.orderNumber}`
      );
      if (res.data.data?.paymentStatus === "PAID") {
        setPaymentConfirmed(true);
        setTimeout(() => {
          onClose();
          router.push(`/${storeSlug}/orders/${transferDetails.orderNumber}`);
        }, 1200);
      } else {
        setCheckStatusMsg(
          "Payment not confirmed yet. Transfers usually confirm within 10–30 seconds — keep this open."
        );
      }
    } catch {
      setCheckStatusMsg("Could not check status right now. Please wait a moment.");
    } finally {
      setCheckingNow(false);
    }
  };

  const handleCopy = (text: string, type: "account" | "amount") => {
    navigator.clipboard.writeText(text);
    if (type === "account") {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      <div
        className="fixed inset-0 bg-slate-950/35 backdrop-blur-[2px]"
        onClick={!loading ? onClose : undefined}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen sm:w-[50vw] sm:max-w-lg bg-[#fafaf8] border-l border-[#daddd4] text-[#0f172a] flex flex-col justify-between shadow-2xl">
          {/* Header with 2-Step Pill Stepper */}
          <div className="px-5 py-4 bg-white border-b border-[#e6e8e1] space-y-3 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-[#0f172a] tracking-tight">
                  Checkout
                </h2>
                <p className="text-xs text-[#64748b] mt-0.5">
                  {transferDetails
                    ? `Order #${transferDetails.orderNumber} — Complete Transfer`
                    : step === 1
                    ? "Step 1 of 2: Shipping & delivery details"
                    : "Step 2 of 2: Review & Pay"}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close checkout"
                className="p-1.5 rounded-full text-[#64748b] hover:text-[#0f172a] hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!transferDetails && (
              <div className="inline-flex items-center gap-1.5 p-1 rounded-full bg-[#f4f5f7] border border-[#e2e8f0] text-xs">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`px-3 py-1.5 rounded-full font-semibold inline-flex items-center gap-1.5 transition cursor-pointer ${
                    step === 1
                      ? "bg-[#2e1065] text-white"
                      : "text-[#64748b] hover:text-[#0f172a]"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] font-bold flex items-center justify-center">
                    1
                  </span>
                  <span>Delivery Address</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-[#94a3b8]" />
                <button
                  type="button"
                  onClick={() => hasValidStep1 && setStep(2)}
                  className={`px-3 py-1.5 rounded-full font-semibold inline-flex items-center gap-1.5 transition cursor-pointer ${
                    step === 2
                      ? "bg-[#2e1065] text-white"
                      : "text-[#64748b]"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-slate-200 text-[#0f172a] text-[10px] font-bold flex items-center justify-center">
                    2
                  </span>
                  <span>Review &amp; Pay</span>
                </button>
              </div>
            )}
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* DVA BANK TRANSFER SCREEN */}
            {transferDetails ? (
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 space-y-5 text-center">
                {paymentConfirmed ? (
                  <div className="py-6 space-y-3">
                    <div className="h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-[#0f172a]">
                      Payment Confirmed!
                    </h3>
                    <p className="text-xs text-[#64748b]">
                      Redirecting to your order receipt...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2e1065]/10 text-[#2e1065] text-[11px] font-bold">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Awaiting Transfer</span>
                      </span>
                      <span className="font-mono text-xs font-bold text-[#0f172a] bg-[#f4f5f7] px-2.5 py-1 rounded-full border border-[#e2e8f0]">
                        Expires in {formatCountdown(secondsLeft)}
                      </span>
                    </div>

                    <p className="text-xs text-[#64748b] text-left">
                      Transfer the exact amount below to complete order{" "}
                      <strong className="text-[#0f172a]">
                        #{transferDetails.orderNumber}
                      </strong>
                      .
                    </p>

                    <div className="bg-[#fafaf8] border border-[#e2e8f0] rounded-xl p-4 space-y-3 text-left">
                      <div>
                        <p className="text-[11px] text-[#64748b]">Bank Name</p>
                        <p className="text-sm font-bold text-[#0f172a]">
                          {transferDetails.bankName}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#e2e8f0]">
                        <p className="text-[11px] text-[#64748b]">Account Name</p>
                        <p className="text-sm font-semibold text-[#0f172a]">
                          {transferDetails.accountName}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#e2e8f0]">
                        <div>
                          <p className="text-[11px] text-[#64748b]">
                            Account Number
                          </p>
                          <p className="font-mono text-lg font-extrabold text-[#0f172a]">
                            {transferDetails.accountNumber}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(transferDetails.accountNumber, "account")
                          }
                          className="px-3 py-1.5 rounded-lg bg-white border border-[#e2e8f0] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          {copiedAccount ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedAccount ? "Copied" : "Copy"}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#e2e8f0]">
                        <div>
                          <p className="text-[11px] text-[#64748b]">
                            Exact Amount
                          </p>
                          <p className="font-display text-lg font-extrabold text-[#2e1065]">
                            {formatCurrency(transferDetails.totalAmount)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              String(transferDetails.totalAmount),
                              "amount"
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-white border border-[#e2e8f0] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          {copiedAmount ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedAmount ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCheckPaymentNow}
                      disabled={checkingNow || secondsLeft === 0}
                      className="w-full h-11 rounded-xl bg-[#2e1065] hover:bg-[#3b0764] disabled:opacity-50 text-white font-display font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      {checkingNow ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Checking transfer...</span>
                        </>
                      ) : (
                        <span>I Have Transferred</span>
                      )}
                    </button>

                    {checkStatusMsg && (
                      <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                        {checkStatusMsg}
                      </p>
                    )}

                    <p className="text-[11px] text-[#64748b]">
                      We detect transfers automatically within seconds of payment.
                    </p>
                  </>
                )}
              </div>
            ) : step === 1 ? (
              <>
                {/* STEP 1: DELIVERY ADDRESS CARD */}
                <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-bold text-[#0f172a]">
                      Delivery Address
                    </h3>
                    {hasValidStep1 && (
                      <button
                        type="button"
                        onClick={() => setEditingAddress((p) => !p)}
                        className="text-xs font-semibold text-[#64748b] hover:text-[#0f172a] cursor-pointer"
                      >
                        {editingAddress ? "Cancel edit" : "+ Update address"}
                      </button>
                    )}
                  </div>

                  {!editingAddress && hasValidStep1 ? (
                    <div className="space-y-1 text-xs text-[#64748b]">
                      <p className="text-[11px] uppercase tracking-wider font-semibold">
                        Primary Shipping Destination
                      </p>
                      <p className="text-sm font-bold text-[#0f172a]">
                        {formData.address}
                      </p>
                      <p>
                        {[formData.city, formData.state, "Nigeria"]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      <p>Contact: {formData.phoneNumber}</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                          House / Street Address *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="39, Onitire Avenue, Abarange road"
                          value={formData.address}
                          onChange={(e) =>
                            setFormData({ ...formData, address: e.target.value })
                          }
                          className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#0f172a] focus:outline-none focus:border-[#2e1065]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                          City / LGA
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Lekki"
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                          className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#0f172a] focus:outline-none focus:border-[#2e1065]"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-[#0f172a]">
                            State *
                          </label>
                          <span className="text-[11px] font-semibold text-emerald-600">
                            Nationwide
                          </span>
                        </div>
                        <select
                          value={formData.state}
                          onChange={(e) =>
                            setFormData({ ...formData, state: e.target.value })
                          }
                          className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#0f172a] focus:outline-none focus:border-[#2e1065]"
                        >
                          {NIGERIAN_STATES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                          Recipient Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Akinyemi Oluwatosin"
                          value={formData.fullName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              fullName: e.target.value,
                            })
                          }
                          className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#0f172a] focus:outline-none focus:border-[#2e1065]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                          Delivery Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="+234 803 123 4567"
                          value={formData.phoneNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              phoneNumber: e.target.value,
                            })
                          }
                          className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#0f172a] focus:outline-none focus:border-[#2e1065]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                          Email Address (for Receipt &amp; Tracking)
                        </label>
                        <input
                          type="email"
                          placeholder="you@example.com"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#0f172a] focus:outline-none focus:border-[#2e1065]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                          Delivery Notes / Instructions{" "}
                          <span className="text-[#94a3b8] font-normal">
                            (Optional)
                          </span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Call before arrival, leave with security gate"
                          value={formData.notes}
                          onChange={(e) =>
                            setFormData({ ...formData, notes: e.target.value })
                          }
                          className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#0f172a] focus:outline-none focus:border-[#2e1065]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* ORDER OVERVIEW CARD */}
                <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 space-y-4">
                  <h3 className="font-display text-base font-bold text-[#0f172a]">
                    Order Overview
                  </h3>

                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div
                        key={`${item.productId}-${item.variantId || idx}`}
                        className="flex items-center gap-3"
                      >
                        <div className="h-12 w-12 rounded-lg bg-[#fafaf8] border border-[#e2e8f0] overflow-hidden shrink-0">
                          {item.image ? (
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#cbd5e1]">
                              <ShoppingBag className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#0f172a] truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-[#64748b]">
                            Qty: {item.quantity} · {formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Promo Code (disabled until upcoming update) */}
                  {PROMOS_ENABLED && (
                  <div className="pt-2 border-t border-[#f1f5f9]">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Promo code (optional)"
                        value={promoInput}
                        onChange={(e) =>
                          setPromoInput(e.target.value.toUpperCase())
                        }
                        className="flex-1 h-9 px-3 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] text-xs font-mono uppercase text-[#0f172a] focus:outline-none focus:border-[#2e1065]"
                      />
                      {appliedPromo ? (
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedPromo(null);
                            setPromoInput("");
                            setPromoError("");
                          }}
                          className="px-3 h-9 rounded-lg bg-slate-100 text-xs font-semibold text-[#0f172a] cursor-pointer"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleApplyPromo}
                          disabled={promoLoading || !promoInput.trim()}
                          className="px-4 h-9 rounded-lg bg-[#2e1065] hover:bg-[#3b0764] disabled:opacity-50 text-xs font-bold text-white cursor-pointer"
                        >
                          {promoLoading ? "..." : "Apply"}
                        </button>
                      )}
                    </div>
                    {promoError && (
                      <p className="text-[11px] text-red-600 mt-1">
                        {promoError}
                      </p>
                    )}
                    {appliedPromo && (
                      <p className="text-[11px] text-emerald-600 mt-1 font-medium">
                        Code {appliedPromo.code} applied (-
                        {formatCurrency(appliedPromo.discountAmount)})
                      </p>
                    )}
                  </div>
                  )}

                  {/* Totals */}
                  <div className="pt-3 border-t border-[#f1f5f9] space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[#64748b]">
                      <span>Items Subtotal</span>
                      <span className="font-semibold text-[#0f172a]">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#64748b]">
                      <span className="inline-flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5" />
                        <span>Shipping ({formData.state})</span>
                      </span>
                      <span
                        className={`font-semibold ${
                          shippingFee === 0 ? "text-emerald-600" : "text-[#0f172a]"
                        }`}
                      >
                        {shippingFee === 0 ? "FREE" : formatCurrency(shippingFee)}
                      </span>
                    </div>
                    {appliedPromo && (
                      <div className="flex items-center justify-between text-emerald-600">
                        <span>Discount ({appliedPromo.code})</span>
                        <span>-{formatCurrency(appliedPromo.discountAmount)}</span>
                      </div>
                    )}
                    <p className="text-[11px] text-[#64748b]">
                      Estimated: 1-2 Business Days (Nationwide)
                    </p>
                    <div className="pt-2 border-t border-[#e2e8f0] flex items-center justify-between">
                      <span className="font-display text-sm font-bold text-[#0f172a]">
                        Estimated Total
                      </span>
                      <span className="font-display text-lg font-extrabold text-[#0f172a]">
                        {formatCurrency(totalDue)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleContinueToPayment}
                    disabled={items.length === 0}
                    className="w-full h-12 rounded-xl bg-[#2e1065] hover:bg-[#3b0764] disabled:opacity-50 text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <span>Continue to Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              /* STEP 2: REVIEW & PAY */
              <div className="space-y-4">
                {/* Delivery Address Summary Card */}
                <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 font-display text-sm font-bold text-[#0f172a]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Delivery Address</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAddress(true);
                        setStep(1);
                      }}
                      className="text-xs font-semibold text-[#0f172a] hover:text-[#2e1065] cursor-pointer"
                    >
                      Update address
                    </button>
                  </div>
                  <p className="text-sm font-bold text-[#0f172a]">
                    {formData.address}
                  </p>
                  <p className="text-xs text-[#64748b]">
                    {[formData.city, formData.state, "Nigeria"]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <div className="pt-1 space-y-0.5 text-xs text-[#64748b]">
                    <p>
                      Recipient:{" "}
                      <span className="font-semibold text-[#0f172a]">
                        {formData.fullName}
                      </span>
                    </p>
                    <p>
                      Contact:{" "}
                      <span className="font-semibold text-[#0f172a]">
                        {formData.phoneNumber}
                      </span>
                    </p>
                    {formData.email && (
                      <p>
                        Receipt:{" "}
                        <span className="font-semibold text-[#0f172a]">
                          {formData.email}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Items in Your Order */}
                <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm font-bold text-[#0f172a]">
                      Items in Your Order ({items.length})
                    </h3>
                    <button
                      type="button"
                      onClick={onClose}
                      className="text-xs font-semibold text-[#64748b] hover:text-[#0f172a] cursor-pointer"
                    >
                      + Add more items
                    </button>
                  </div>
                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div
                        key={`${item.productId}-${item.variantId || idx}`}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-12 w-12 rounded-lg bg-[#fafaf8] border border-[#e2e8f0] overflow-hidden shrink-0">
                            {item.image ? (
                              <img
                                src={getImageUrl(item.image)}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#cbd5e1]">
                                <ShoppingBag className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#0f172a] truncate">
                              {item.title}
                            </p>
                            {item.variantName && (
                              <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-[#0f172a]">
                                {item.variantName}
                              </span>
                            )}
                            <p className="text-[11px] text-[#64748b] mt-0.5">
                              Qty: {item.quantity} (@ {formatCurrency(item.price)}{" "}
                              each)
                            </p>
                          </div>
                        </div>
                        <span className="font-display text-xs font-bold text-[#0f172a] shrink-0">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Method: Pay with Transfer */}
                <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 font-display text-sm font-bold text-[#0f172a]">
                      <Landmark className="w-4 h-4 text-[#0f172a]" />
                      <span>Payment Method</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                      Instant Bank Transfer
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl border-2 border-[#2e1065] bg-[#2e1065]/[0.03] flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#2e1065] text-white flex items-center justify-center font-display font-extrabold text-sm shrink-0">
                      ₦
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#0f172a]">
                        Pay with Transfer
                      </p>
                      <p className="text-[11px] text-[#64748b]">
                        Unique bank account generated for this order
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 space-y-3 text-xs">
                  <h3 className="font-display text-sm font-bold text-[#0f172a]">
                    Payment Summary
                  </h3>
                  <div className="flex items-center justify-between text-[#64748b]">
                    <span>Subtotal ({items.length} items)</span>
                    <span className="font-semibold text-[#0f172a]">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#64748b]">
                    <span className="inline-flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" />
                      <span>Delivery ({formData.state})</span>
                    </span>
                    <span
                      className={`font-semibold ${
                        shippingFee === 0 ? "text-emerald-600" : "text-[#0f172a]"
                      }`}
                    >
                      {shippingFee === 0 ? "FREE" : formatCurrency(shippingFee)}
                    </span>
                  </div>
                  {appliedPromo && (
                    <div className="flex items-center justify-between text-emerald-600">
                      <span>Promo ({appliedPromo.code})</span>
                      <span>-{formatCurrency(appliedPromo.discountAmount)}</span>
                    </div>
                  )}
                  <p className="text-[11px] text-[#64748b]">
                    Estimated Time: 1-2 Business Days (Nationwide)
                  </p>
                  <div className="pt-2 border-t border-[#e2e8f0] flex items-center justify-between">
                    <span className="font-display text-sm font-bold text-[#0f172a]">
                      Total Payable
                    </span>
                    <span className="font-display text-xl font-extrabold text-[#2e1065]">
                      {formatCurrency(totalDue)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleInitializeOrder}
                    disabled={loading || items.length === 0}
                    className="w-full h-12 rounded-xl bg-[#2e1065] hover:bg-[#3b0764] disabled:opacity-50 text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer mt-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating Account...</span>
                      </>
                    ) : (
                      <span>
                        Pay {formatCurrency(totalDue)} with Transfer
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full text-center text-xs font-medium text-[#64748b] hover:text-[#0f172a] pt-1 cursor-pointer"
                  >
                    ← Back to Delivery Details
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
