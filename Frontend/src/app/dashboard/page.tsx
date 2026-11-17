"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  Copy,
  Check,
  ExternalLink,
  PlusCircle,
  Building2,
  Package,
  TrendingUp,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, store, isAuthenticated, initialize, logout, updateStore } =
    useAuthStore();

  const [copied, setCopied] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankName: "",
    bankCode: "058", // Default GTBank
    accountNumber: "",
    accountName: "",
  });
  const [bankLoading, setBankLoading] = useState(false);
  const [bankSuccess, setBankSuccess] = useState(false);
  const [bankError, setBankError] = useState("");

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    // If not authenticated after initialization, redirect to login
    const token = localStorage.getItem("kredibly_auth_token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (store) {
      setBankForm({
        bankName: store.bankName || "",
        bankCode: store.bankCode || "058",
        accountNumber: store.accountNumber || "",
        accountName: store.accountName || "",
      });
    }
  }, [store]);

  const storeSlug = store?.slug || "mystore";
  const storeUrl = `https://kredibly.shop/${storeSlug}`;

  const copyStoreLink = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankLoading(true);
    setBankError("");
    setBankSuccess(false);

    try {
      const res = await api.put("/auth/bank-details", bankForm);
      updateStore(res.data.data);
      setBankSuccess(true);
      setTimeout(() => {
        setBankModalOpen(false);
        setBankSuccess(false);
      }, 1500);
    } catch (err: any) {
      setBankError(
        err.response?.data?.message || "Failed to update bank details."
      );
    } finally {
      setBankLoading(false);
    }
  };

  if (!isAuthenticated && !user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  const hasBankDetails = Boolean(store?.accountNumber && store?.bankName);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <img
            src="/kredibly-k-icon.png"
            alt="Kredibly"
            className="h-8 w-8 rounded-lg object-cover shrink-0"
          />
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">
              {store?.name || "My Store"}
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">
              kredibly.shop/{storeSlug}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 ml-6 text-xs font-semibold">
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-white"
            >
              Overview
            </Link>
            <Link
              href="/dashboard/products"
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition"
            >
              Products
            </Link>
            <Link
              href="/dashboard/orders"
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition"
            >
              Orders
            </Link>
            <Link
              href="/dashboard/customers"
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition"
            >
              Customers
            </Link>
            <Link
              href="/dashboard/wallet"
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition"
            >
              Wallet
            </Link>
            <Link
              href="/dashboard/settings"
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition"
            >
              Settings
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/${storeSlug}`}
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg transition"
          >
            <span>Preview Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Store Link Card */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-brand-950/40 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Live Storefront Active
            </div>
            <h2 className="text-xl font-extrabold text-white">
              Your Store Bio Link
            </h2>
            <p className="text-sm text-slate-400">
              Share this link in your Instagram bio and WhatsApp status to accept orders.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm text-brand-400 select-all truncate max-w-xs">
              {storeUrl}
            </div>
            <button
              onClick={copyStoreLink}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold rounded-xl transition text-xs flex items-center gap-1.5 shrink-0 shadow-md shadow-brand-500/20"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-950" />
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Setup Checklist */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-base font-bold text-white mb-4">
            🚀 2-Minute Setup Checklist
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    Claim your unique store handle
                  </p>
                  <p className="text-xs text-slate-400">
                    Your handle <span className="text-brand-400">kredibly.shop/{storeSlug}</span> is reserved.
                  </p>
                </div>
              </div>
              <span className="text-xs text-brand-400 font-medium">Done</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="flex items-center gap-3">
                {hasBankDetails ? (
                  <CheckCircle2 className="w-5 h-5 text-brand-500 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-amber-500 shrink-0" />
                )}
                <div>
                  <p className="text-sm font-semibold text-white">
                    Set up payout bank account
                  </p>
                  <p className="text-xs text-slate-400">
                    {hasBankDetails
                      ? `${store?.bankName} • ${store?.accountNumber} (${store?.accountName})`
                      : "Add your Nigerian bank details to receive sales payouts."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBankModalOpen(true)}
                className="text-xs font-semibold text-slate-950 bg-brand-500 hover:bg-brand-600 px-3 py-1.5 rounded-lg transition"
              >
                {hasBankDetails ? "Edit" : "Add Bank"}
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="flex items-center gap-3">
                <Circle className="w-5 h-5 text-slate-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    Add your first product
                  </p>
                  <p className="text-xs text-slate-400">
                    Upload photos, set your price, and start selling.
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/products"
                className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition"
              >
                Add Product
              </Link>
            </div>
          </div>
        </div>

        {/* Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Link
            href="/dashboard/wallet"
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Available to Withdraw
              </span>
              <TrendingUp className="w-4 h-4 text-brand-500" />
            </div>
            <p className="text-2xl font-extrabold text-white">
              {formatCurrency(store?.wallet?.availableBalance || 0)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Ready for 1-click payout to bank →
            </p>
          </Link>

          <Link
            href="/dashboard/wallet"
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                In Escrow (Safe Hold)
              </span>
              <ShieldCheck className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-extrabold text-amber-400">
              {formatCurrency(store?.wallet?.escrowBalance || 0)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Clears as soon as orders are delivered →
            </p>
          </Link>

          <Link
            href="/dashboard/products"
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Manage Products
              </span>
              <Package className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-extrabold text-white">Catalog</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Add products & control inventory →
            </p>
          </Link>
        </div>
      </main>

      {/* Bank Account Modal */}
      {bankModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-500" />
                <h3 className="text-lg font-bold text-white">
                  Payout Bank Details
                </h3>
              </div>
              <button
                onClick={() => setBankModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Your sales payouts will be deposited directly into this Nigerian bank account.
            </p>

            {bankError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bankError}</span>
              </div>
            )}

            {bankSuccess && (
              <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Bank details saved successfully!</span>
              </div>
            )}

            <form onSubmit={handleBankSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Bank Name
                </label>
                <select
                  value={bankForm.bankName}
                  onChange={(e) => {
                    const selected = e.target.value;
                    const codes: Record<string, string> = {
                      GTBank: "058",
                      "Access Bank": "044",
                      "First Bank": "011",
                      "UBA (United Bank for Africa)": "033",
                      "Zenith Bank": "057",
                      "Kuda Bank": "50211",
                      "Opay": "999992",
                      "Palmpay": "999991",
                      "Moniepoint MFB": "50515",
                    };
                    setBankForm({
                      ...bankForm,
                      bankName: selected,
                      bankCode: codes[selected] || "058",
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
                >
                  <option value="">Select your bank</option>
                  <option value="GTBank">GTBank (Guaranty Trust Bank)</option>
                  <option value="Access Bank">Access Bank</option>
                  <option value="First Bank">First Bank of Nigeria</option>
                  <option value="Zenith Bank">Zenith Bank</option>
                  <option value="UBA (United Bank for Africa)">UBA</option>
                  <option value="Kuda Bank">Kuda Bank</option>
                  <option value="Opay">Opay</option>
                  <option value="Palmpay">Palmpay</option>
                  <option value="Moniepoint MFB">Moniepoint MFB</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  10-Digit NUBAN Account Number
                </label>
                <input
                  type="text"
                  maxLength={10}
                  required
                  placeholder="0123456789"
                  value={bankForm.accountNumber}
                  onChange={(e) =>
                    setBankForm({
                      ...bankForm,
                      accountNumber: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SARAH CHUKWU OKAFOR"
                  value={bankForm.accountName}
                  onChange={(e) =>
                    setBankForm({ ...bankForm, accountName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 uppercase"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBankModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bankLoading}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {bankLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : null}
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
