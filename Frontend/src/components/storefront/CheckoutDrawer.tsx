"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  X,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Loader2,
  Lock,
  MapPin,
  Phone,
  User,
  Building2,
  Copy,
  Check,
  CreditCard,
  Zap,
} from "lucide-react";

const NIGERIAN_STATES = [
  "Lagos",
  "Abuja FCT",
  "Rivers",
  "Oyo",
  "Kano",
  "Delta",
  "Edo",
  "Enugu",
  "Anambra",
  "Ogun",
  "Akwa Ibom",
  "Kaduna",
  "Ondo",
  "Imo",
  "Abia",
  "Cross River",
  "Plateau",
  "Kwara",
  "Osun",
  "Benue",
  "Bayelsa",
  "Ekiti",
  "Ebonyi",
  "Nasarawa",
  "Taraba",
  "Adamawa",
  "Bauchi",
  "Borno",
  "Gombe",
  "Jigawa",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Niger",
  "Sokoto",
  "Yobe",
  "Zamfara",
];

interface CheckoutDrawerProps {
  storeSlug: string;
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
  isOpen,
  onClose,
}: CheckoutDrawerProps) {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const subtotal = getSubtotal();

  const [paymentMethod, setPaymentMethod] = useState<"BANK_TRANSFER" | "CARD">(
    "BANK_TRANSFER"
  );

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    address: "",
    state: "Lagos",
    city: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  // Dynamic Virtual Account state
  const [transferDetails, setTransferDetails] = useState<VirtualAccountState | null>(
    null
  );
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Polling for Bank Transfer completion
  useEffect(() => {
    if (!transferDetails || paymentConfirmed) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/checkout/orders/${transferDetails.orderNumber}`);
        if (res.data.data?.paymentStatus === "PAID") {
          setPaymentConfirmed(true);
          clearInterval(interval);
          setTimeout(() => {
            router.push(`/${storeSlug}/orders/${transferDetails.orderNumber}`);
          }, 1500);
        }
      } catch (err) {
        // Silent poll error
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [transferDetails, paymentConfirmed, router, storeSlug]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        paymentMethod,
      };

      const res = await api.post("/checkout/initialize", payload);
      const data = res.data.data;

      // Clear local cart
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

  const handleSimulatePayment = async () => {
    if (!transferDetails) return;
    setIsVerifyingPayment(true);
    try {
      await api.post("/checkout/simulate-payment", {
        reference: transferDetails.reference,
      });
      setPaymentConfirmed(true);
      setTimeout(() => {
        router.push(`/${storeSlug}/orders/${transferDetails.orderNumber}`);
      }, 1500);
    } catch (err: any) {
      setErrorMsg("Simulation failed");
      setIsVerifyingPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-slate-900 border-l border-slate-800 text-white flex flex-col justify-between shadow-2xl">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400" />
              <h2 className="text-base font-bold text-white">
                {transferDetails ? "Transfer Payment" : "1-Step Fast Checkout"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {transferDetails ? (
              /* DVA Bank Transfer View */
              <div className="space-y-6">
                {paymentConfirmed ? (
                  <div className="p-6 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-purple-500 text-slate-950 mx-auto flex items-center justify-center font-bold">
                      <Check className="w-6 h-6" />
                    </div>
                    <h3 className="font-display font-extrabold text-lg text-white">
                      Payment Received!
                    </h3>
                    <p className="text-xs text-slate-300">
                      Redirecting you to your order confirmation receipt...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-900/50 flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-purple-200">
                          Protected by Kredibly Escrow
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          Your money is safely locked. It is only released to the seller after your order is dispatched.
                        </p>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                      <div className="text-center pb-2 border-b border-slate-800">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                          Amount to Transfer
                        </span>
                        <div className="flex items-center justify-center gap-2 mt-1">
                          <p className="font-display text-3xl font-extrabold text-white">
                            {formatCurrency(transferDetails.totalAmount)}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(transferDetails.totalAmount.toString(), "amount")
                            }
                            className="p-1 rounded text-slate-400 hover:text-white"
                            title="Copy Amount"
                          >
                            {copiedAmount ? (
                              <Check className="w-4 h-4 text-purple-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                          <span className="text-slate-400">Bank Name</span>
                          <span className="font-bold text-white font-mono">
                            {transferDetails.bankName}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                          <span className="text-slate-400">Account Number</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-base font-extrabold text-purple-400">
                              {transferDetails.accountNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(transferDetails.accountNumber, "account")
                              }
                              className="px-2 py-1 rounded bg-purple-900/60 hover:bg-purple-800 text-[11px] font-bold text-purple-200 flex items-center gap-1 transition"
                            >
                              {copiedAccount ? (
                                <>
                                  <Check className="w-3 h-3 text-purple-300" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between py-2">
                          <span className="text-slate-400">Beneficiary Name</span>
                          <span className="font-bold text-slate-200">
                            {transferDetails.accountName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Listening for payment status indicator */}
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-400 shrink-0" />
                      <div className="text-xs">
                        <p className="font-semibold text-slate-200">
                          Listening for your transfer...
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Make the bank transfer using your mobile bank app or USSD.
                        </p>
                      </div>
                    </div>

                    {/* Dev Mode Simulator Button */}
                    <button
                      type="button"
                      onClick={handleSimulatePayment}
                      disabled={isVerifyingPayment}
                      className="w-full py-2.5 rounded-xl border border-dashed border-purple-800 text-purple-300 hover:bg-purple-950/40 text-xs font-semibold flex items-center justify-center gap-2 transition"
                    >
                      {isVerifyingPayment ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5" />
                      )}
                      <span>I have transferred (Simulate Dev Confirmation)</span>
                    </button>
                  </>
                )}
              </div>
            ) : (
              /* Checkout Form View */
              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Payment Method Selector */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Select Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("BANK_TRANSFER")}
                      className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        paymentMethod === "BANK_TRANSFER"
                          ? "bg-purple-950/40 border-purple-500 text-white"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <Building2
                          className={`w-4 h-4 ${
                            paymentMethod === "BANK_TRANSFER"
                              ? "text-purple-400"
                              : "text-slate-500"
                          }`}
                        />
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                          Popular
                        </span>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs font-bold text-white">Bank Transfer</p>
                        <p className="text-[10px] text-slate-400">
                          Direct virtual account
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("CARD")}
                      className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        paymentMethod === "CARD"
                          ? "bg-purple-950/40 border-purple-500 text-white"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <CreditCard
                        className={`w-4 h-4 ${
                          paymentMethod === "CARD"
                            ? "text-purple-400"
                            : "text-slate-500"
                        }`}
                      />
                      <div className="mt-2">
                        <p className="text-xs font-bold text-white">Debit Card / USSD</p>
                        <p className="text-[10px] text-slate-400">Mastercard, Visa, Verve</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Delivery Details
                  </h3>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Amaka Okafor"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      WhatsApp / Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        placeholder="08012345678"
                        value={formData.phoneNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, phoneNumber: e.target.value })
                        }
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="amaka@gmail.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Delivery Street Address *
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="Street address, house number, landmark"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        State *
                      </label>
                      <select
                        value={formData.state}
                        onChange={(e) =>
                          setFormData({ ...formData, state: e.target.value })
                        }
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                      >
                        {NIGERIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        City / Town
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Lekki Phase 1"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Order Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Special delivery instructions or size notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>
                </div>

                {/* Trust Shield Note */}
                <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-900/40 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-purple-200/90 leading-relaxed">
                    <strong>Zero Scam Risk:</strong> Your money is protected in Kredibly Escrow until you receive your items.
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* Footer CTA */}
          {!transferDetails && (
            <div className="p-5 border-t border-slate-800 bg-slate-950 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400">Total Due</span>
                <span className="text-base font-extrabold text-white">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={loading || items.length === 0}
                className="w-full py-3.5 bg-purple-900 hover:bg-purple-800 disabled:opacity-50 text-white font-extrabold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-md shadow-purple-950/30 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating Secure Checkout...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {paymentMethod === "BANK_TRANSFER"
                        ? "Get Bank Transfer Details"
                        : "Proceed to Card Payment"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
