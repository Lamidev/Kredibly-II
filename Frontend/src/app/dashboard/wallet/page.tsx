"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  TrendingUp,
  ShieldCheck,
  Building2,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  CreditCard,
  Edit2,
  Check,
} from "lucide-react";

interface Transaction {
  id: string;
  amount: number | string;
  netAmount: number | string;
  type: string;
  status: string;
  reference: string;
  createdAt: string;
  order?: {
    orderNumber: string;
    customer: { fullName: string };
  } | null;
}

interface WalletData {
  availableBalance: number | string;
  escrowBalance: number | string;
  bank: {
    bankName?: string | null;
    bankCode?: string | null;
    accountNumber?: string | null;
    accountName?: string | null;
  };
  transactions: Transaction[];
}

const NIGERIAN_BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "Guaranty Trust Bank (GTBank)", code: "058" },
  { name: "Zenith Bank", code: "057" },
  { name: "United Bank for Africa (UBA)", code: "033" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "Kuda Bank", code: "50211" },
  { name: "OPay", code: "999992" },
  { name: "Palmpay", code: "999991" },
  { name: "Moniepoint MFB", code: "50515" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Sterling Bank", code: "232" },
  { name: "Fidelity Bank", code: "070" },
  { name: "Wema Bank / ALAT", code: "035" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "FCMB", code: "214" },
  { name: "Polaris Bank", code: "076" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "Taj Bank", code: "302" },
  { name: "Jaiz Bank", code: "301" },
];

export default function WalletPage() {
  const router = useRouter();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  // Withdrawal Modal
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState("");

  // Bank Setup Modal
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState(NIGERIAN_BANKS[0]);
  const [accountNumber, setAccountNumber] = useState("");
  const [resolvedAccountName, setResolvedAccountName] = useState("");
  const [verifyingBank, setVerifyingBank] = useState(false);
  const [bankError, setBankError] = useState("");
  const [savingBank, setSavingBank] = useState(false);

  const fetchWallet = async () => {
    try {
      const res = await api.get("/wallet");
      setWallet(res.data.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  // Live account name verification when 10 digits are typed
  useEffect(() => {
    if (accountNumber.trim().length === 10) {
      handleVerifyBank(selectedBank.code, accountNumber.trim());
    } else {
      setResolvedAccountName("");
      setBankError("");
    }
  }, [accountNumber, selectedBank]);

  const handleVerifyBank = async (bankCode: string, accNo: string) => {
    setVerifyingBank(true);
    setBankError("");
    try {
      const res = await api.post("/wallet/verify-bank", {
        bankCode,
        accountNumber: accNo,
      });
      setResolvedAccountName(res.data.data.accountName);
    } catch (err: any) {
      setBankError(err.response?.data?.message || "Could not verify bank account");
      setResolvedAccountName("");
    } finally {
      setVerifyingBank(false);
    }
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedAccountName) return;

    setSavingBank(true);
    setBankError("");

    try {
      await api.put("/wallet/bank-details", {
        bankName: selectedBank.name,
        bankCode: selectedBank.code,
        accountNumber: accountNumber.trim(),
        accountName: resolvedAccountName,
      });

      await fetchWallet();
      setBankModalOpen(false);
    } catch (err: any) {
      setBankError(err.response?.data?.message || "Failed to save bank details");
    } finally {
      setSavingBank(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError("");
    setWithdrawSuccess("");
    setWithdrawing(true);

    try {
      const amount = Number(withdrawAmount);
      const res = await api.post("/wallet/withdraw", { amount });

      setWithdrawSuccess(res.data.data.message);
      setWithdrawAmount("");
      await fetchWallet();

      setTimeout(() => {
        setWithdrawModalOpen(false);
        setWithdrawSuccess("");
      }, 2500);
    } catch (err: any) {
      setWithdrawError(
        err.response?.data?.message || "Withdrawal failed. Please try again."
      );
    } finally {
      setWithdrawing(false);
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "SALE":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
            <ArrowDownLeft className="w-3 h-3 text-amber-500" /> Sale (In Escrow)
          </span>
        );
      case "ESCROW_RELEASE":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
            <CheckCircle2 className="w-3 h-3 text-purple-400" /> Escrow Released
          </span>
        );
      case "WITHDRAWAL":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
            <ArrowUpRight className="w-3 h-3 text-blue-400" /> Payout to Bank
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
            {type}
          </span>
        );
    }
  };

  const available = Number(wallet?.availableBalance || 0);
  const escrow = Number(wallet?.escrowBalance || 0);
  const hasBankDetails = Boolean(
    wallet?.bank?.bankName && wallet?.bank?.accountNumber
  );

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
          <h1 className="text-base font-bold text-white">Wallet &amp; Payouts</h1>
        </div>

        <button
          onClick={() => setWithdrawModalOpen(true)}
          disabled={available < 1000 || !hasBankDetails}
          className="px-4 py-2 bg-purple-900 hover:bg-purple-800 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-purple-950/30 active:scale-[0.98]"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Withdraw to Bank</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          </div>
        ) : (
          <>
            {/* 3 Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Available Balance */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-purple-950/30 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Available for Payout
                  </span>
                  <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>

                <p className="text-3xl font-extrabold text-white">
                  {formatCurrency(available)}
                </p>

                <p className="text-xs text-slate-400">
                  Ready for instant 1-click cashout directly to your verified Nigerian bank account.
                </p>
              </div>

              {/* Card 2: In Escrow */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Held in Safe Escrow
                  </span>
                  <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>

                <p className="text-3xl font-extrabold text-amber-400">
                  {formatCurrency(escrow)}
                </p>

                <p className="text-xs text-slate-400">
                  Transfers to your Available Balance as soon as orders are marked delivered.
                </p>
              </div>

              {/* Card 3: Payout Bank Account */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Verified Payout Bank
                    </span>
                    <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                  </div>

                  {hasBankDetails ? (
                    <div className="mt-3">
                      <p className="text-base font-bold text-white">
                        {wallet?.bank?.bankName}
                      </p>
                      <p className="font-mono text-sm text-purple-400 font-bold">
                        {wallet?.bank?.accountNumber}
                      </p>
                      <p className="text-xs text-slate-300 truncate mt-0.5">
                        {wallet?.bank?.accountName}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <p className="text-xs text-amber-400 font-semibold">
                        No payout bank linked yet
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Link your bank account to enable instant withdrawals.
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setBankModalOpen(true)}
                  className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{hasBankDetails ? "Change Payout Bank" : "Link Bank Account"}</span>
                </button>
              </div>
            </div>

            {/* Financial Ledger / Transaction History */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">
                  Financial Ledger &amp; History
                </h3>
                <span className="text-xs text-slate-500">
                  {wallet?.transactions?.length || 0} transactions
                </span>
              </div>

              {wallet?.transactions?.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No financial activity recorded yet. Transactions will show here when sales occur.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                        <th className="pb-3">Type</th>
                        <th className="pb-3">Reference / Order</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {wallet?.transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-850/50">
                          <td className="py-3.5 pr-3">
                            {getTransactionBadge(tx.type)}
                          </td>
                          <td className="py-3.5 pr-3 font-mono text-slate-300">
                            {tx.order ? `#${tx.order.orderNumber}` : tx.reference}
                          </td>
                          <td className="py-3.5 pr-3 text-slate-400">
                            {new Date(tx.createdAt).toLocaleDateString("en-NG", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3.5 pr-3">
                            <span className="text-purple-400 font-semibold">
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-right font-bold text-white font-mono">
                            {tx.type === "WITHDRAWAL" ? (
                              <span className="text-red-400">
                                -{formatCurrency(Number(tx.amount))}
                              </span>
                            ) : (
                              <span className="text-emerald-400">
                                +{formatCurrency(Number(tx.netAmount))}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* 1. Modal: Link & Verify Bank Details */}
      {bankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  Link Nigerian Bank Account
                </h3>
              </div>
              <button
                onClick={() => setBankModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bankError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bankError}</span>
              </div>
            )}

            <form onSubmit={handleSaveBank} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Commercial Bank / FinTech *
                </label>
                <select
                  value={selectedBank.code}
                  onChange={(e) => {
                    const found = NIGERIAN_BANKS.find(
                      (b) => b.code === e.target.value
                    );
                    if (found) setSelectedBank(found);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {NIGERIAN_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  10-Digit NUBAN Account Number *
                </label>
                <input
                  type="text"
                  maxLength={10}
                  required
                  placeholder="0123456789"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono tracking-wider focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Resolved Name Preview */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs min-h-[46px] flex items-center justify-between">
                <span className="text-slate-400">Account Holder:</span>
                {verifyingBank ? (
                  <div className="flex items-center gap-1.5 text-purple-400 font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying with Nomba...</span>
                  </div>
                ) : resolvedAccountName ? (
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>{resolvedAccountName}</span>
                  </div>
                ) : (
                  <span className="text-slate-500">Type 10 digits to verify</span>
                )}
              </div>

              <button
                type="submit"
                disabled={!resolvedAccountName || savingBank}
                className="w-full py-3 bg-purple-900 hover:bg-purple-800 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-md shadow-purple-950/20"
              >
                {savingBank ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Save Verified Bank Details</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Withdraw Funds */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  Withdraw to Bank Account
                </h3>
              </div>
              <button
                onClick={() => setWithdrawModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {withdrawError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{withdrawError}</span>
              </div>
            )}

            {withdrawSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{withdrawSuccess}</span>
              </div>
            )}

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                <p className="text-slate-400">Destination Account:</p>
                <p className="font-bold text-white">
                  {wallet?.bank?.bankName} — {wallet?.bank?.accountNumber}
                </p>
                <p className="text-[11px] text-slate-400">
                  {wallet?.bank?.accountName}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label className="font-semibold text-slate-300">
                    Withdrawal Amount (₦) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(available.toString())}
                    className="text-purple-400 hover:underline font-bold text-[11px]"
                  >
                    Withdraw All ({formatCurrency(available)})
                  </button>
                </div>
                <input
                  type="number"
                  min={1000}
                  max={available}
                  required
                  placeholder="Min ₦1,000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Dispatches via Nomba NIP Transfer directly to your bank.</span>
              </div>

              <button
                type="submit"
                disabled={withdrawing || Number(withdrawAmount) < 1000 || Number(withdrawAmount) > available}
                className="w-full py-3 bg-purple-900 hover:bg-purple-800 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-md shadow-purple-950/20 active:scale-[0.98]"
              >
                {withdrawing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Confirm Payout</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
