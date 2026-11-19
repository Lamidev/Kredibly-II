"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatCurrency, formatNumberInput, parseNumberInput } from "@/lib/utils";
import {
  TrendingUp,
  ShieldCheck,
  Building2,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CreditCard,
  Edit2,
  Check,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  withdrawalLockedUntil?: string | null;
  kyc?: {
    status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" | string;
    idType?: string | null;
    idLast4?: string | null;
    verifiedName?: string | null;
    verifiedAt?: string | null;
  };
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
  { name: "Wema Bank", code: "035" },
  { name: "Sterling Bank", code: "232" },
  { name: "Fidelity Bank", code: "070" },
];

export default function WalletPage() {
  const router = useRouter();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [txPage, setTxPage] = useState(1);
  const TX_PAGE_SIZE = 10;

  // Withdrawal Modal
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawOtp, setWithdrawOtp] = useState("");
  const [withdrawOtpSent, setWithdrawOtpSent] = useState(false);
  const [sendingWithdrawOtp, setSendingWithdrawOtp] = useState(false);
  const [withdrawMaskedEmail, setWithdrawMaskedEmail] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  // Bank Setup Modal
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState(NIGERIAN_BANKS[0]);
  const [accountNumber, setAccountNumber] = useState("");
  const [resolvedAccountName, setResolvedAccountName] = useState("");
  const [verifyingBank, setVerifyingBank] = useState(false);
  const [bankError, setBankError] = useState("");
  const [savingBank, setSavingBank] = useState(false);
  const [bankOtp, setBankOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);

  // KYC verification state
  const [kycIdType, setKycIdType] = useState<"NIN" | "BVN">("NIN");
  const [kycIdNumber, setKycIdNumber] = useState("");
  const [submittingKyc, setSubmittingKyc] = useState(false);

  const fetchWallet = async () => {
    try {
      const res = await api.get("/wallet");
      setWallet(res.data.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push("/login");
      } else {
        toast.error("Failed to load wallet data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

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

  const handleRequestBankOtp = async () => {
    setSendingOtp(true);
    setBankError("");
    setOtpMessage("");
    try {
      const res = await api.post("/wallet/request-bank-otp");
      setOtpSent(true);
      const msg = res.data.message || "Confirmation code sent to your email.";
      setOtpMessage(msg);
      toast.success(msg);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to send confirmation code";
      setBankError(msg);
      toast.error(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedAccountName) return;
    if (hasBankDetails && bankOtp.trim().length !== 6) {
      const msg = "Please enter the 6-digit confirmation code sent to your email.";
      setBankError(msg);
      toast.error(msg);
      return;
    }

    setSavingBank(true);
    setBankError("");

    try {
      await api.put("/wallet/bank-details", {
        bankName: selectedBank.name,
        bankCode: selectedBank.code,
        accountNumber: accountNumber.trim(),
        accountName: resolvedAccountName,
        ...(hasBankDetails ? { otp: bankOtp.trim() } : {}),
      });

      await fetchWallet();
      setBankModalOpen(false);
      setBankOtp("");
      setOtpSent(false);
      setOtpMessage("");
      toast.success(
        hasBankDetails
          ? "Bank account updated! Withdrawals are locked for 24 hours for security."
          : "Payout bank account saved successfully!"
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to save bank details";
      setBankError(msg);
      toast.error(msg);
    } finally {
      setSavingBank(false);
    }
  };

  const formatWithdrawInput = (val: string | number): string => {
    if (val === "" || val === null || val === undefined) return "";
    const cleaned = String(val).replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    const intPart = parts[0] || "";
    const decPart = parts.length > 1 ? parts[1].slice(0, 2) : null;
    if (!intPart && decPart === null) return "";
    const formattedInt = intPart ? Number(intPart).toLocaleString("en-NG") : "0";
    return decPart !== null ? `${formattedInt}.${decPart}` : formattedInt;
  };

  const parseWithdrawInput = (val: string): number => {
    const cleaned = String(val).replace(/,/g, "").replace(/[^0-9.]/g, "");
    const num = Number(cleaned);
    return Number.isFinite(num) ? Math.round(num * 100) / 100 : 0;
  };

  const parsedWithdrawAmount = parseWithdrawInput(withdrawAmount);
  const instantTransferFee =
    parsedWithdrawAmount >= 1000
      ? parsedWithdrawAmount < 5000
        ? 20
        : parsedWithdrawAmount <= 50000
        ? 25
        : 50
      : 0;
  const netWithdrawReceive = Math.max(
    0,
    Math.round((parsedWithdrawAmount - instantTransferFee) * 100) / 100
  );

  const handleRequestWithdrawOtp = async () => {
    if (parsedWithdrawAmount < 1000 || parsedWithdrawAmount > available) return;
    setSendingWithdrawOtp(true);
    try {
      const res = await api.post("/wallet/request-withdrawal-otp", {
        amount: parsedWithdrawAmount,
      });
      setWithdrawOtpSent(true);
      setWithdrawMaskedEmail(res.data?.data?.maskedEmail || "your email");
      toast.success(
        res.data?.message || "Confirmation code sent to your email."
      );
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Could not send confirmation code."
      );
    } finally {
      setSendingWithdrawOtp(false);
    }
  };

  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingKyc || !/^\d{11}$/.test(kycIdNumber.trim())) return;
    setSubmittingKyc(true);
    try {
      const res = await api.post("/wallet/kyc", {
        idType: kycIdType,
        idNumber: kycIdNumber.trim(),
      });
      toast.success(res.data?.message || "Identity verification submitted!");
      setKycIdNumber("");
      await fetchWallet();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Identity verification failed. Please check your details."
      );
    } finally {
      setSubmittingKyc(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawOtpSent) {
      await handleRequestWithdrawOtp();
      return;
    }
    setWithdrawing(true);

    try {
      const res = await api.post("/wallet/withdraw", {
        amount: parsedWithdrawAmount,
        otp: withdrawOtp.trim(),
      });

      toast.success(res.data.data.message || "Withdrawal dispatched!");
      setWithdrawAmount("");
      setWithdrawOtp("");
      setWithdrawOtpSent(false);
      setWithdrawMaskedEmail("");
      setWithdrawModalOpen(false);
      await fetchWallet();
    } catch (err: any) {
      toast.error(
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
          <Badge variant="success">
            <ArrowDownLeft className="w-3 h-3" /> Sale Credited
          </Badge>
        );
      case "ESCROW_RELEASE":
        return (
          <Badge variant="default">
            <CheckCircle2 className="w-3 h-3" /> Escrow Released
          </Badge>
        );
      case "WITHDRAWAL":
        return (
          <Badge variant="success">
            <ArrowUpRight className="w-3 h-3" /> Payout to Bank
          </Badge>
        );
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const available = Number(wallet?.availableBalance || 0);
  const hasBankDetails = Boolean(
    wallet?.bank?.bankName && wallet?.bank?.accountNumber
  );
  const lockedUntilDate = wallet?.withdrawalLockedUntil
    ? new Date(wallet.withdrawalLockedUntil)
    : null;
  const isWithdrawalLocked = Boolean(
    lockedUntilDate && lockedUntilDate > new Date()
  );
  const kycStatus = wallet?.kyc?.status || "UNVERIFIED";
  const isKycVerified = kycStatus === "VERIFIED";

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
            Wallet &amp; Payouts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track your available balance, payouts, and withdraw to your Nigerian bank.
          </p>
        </div>

        <Button
          onClick={() => setWithdrawModalOpen(true)}
          disabled={
            available < 1000 ||
            !hasBankDetails ||
            isWithdrawalLocked ||
            !isKycVerified
          }
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>
            {!isKycVerified
              ? "Verify KYC to Withdraw"
              : isWithdrawalLocked
              ? "Withdrawals Locked (24h)"
              : "Withdraw to Bank"}
          </span>
        </Button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#2e1065]" />
        </div>
      ) : (
        <>
          {isWithdrawalLocked && lockedUntilDate && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-amber-900">
                  24-Hour Security Withdrawal Lock Active
                </p>
                <p className="text-amber-800 leading-relaxed">
                  Because your payout bank account was recently changed, withdrawals are temporarily paused until{" "}
                  <strong>
                    {lockedUntilDate.toLocaleString("en-NG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </strong>{" "}
                  to protect your funds against unauthorized transfers.
                </p>
              </div>
            </div>
          )}

          {/* Metric Cards (2 in a row on mobile & desktop) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-4 sm:p-6 space-y-2 h-full flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] sm:text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                    <span>Available Balance</span>
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 border border-slate-200/70 flex items-center justify-center text-[#2e1065] shrink-0">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <p className="font-display text-xl sm:text-3xl font-bold text-[#0f172a] truncate">
                    {formatCurrency(available)}
                  </p>
                </div>
                <p className="text-[10.5px] sm:text-[11px] text-slate-500">
                  Min. withdrawal ₦1,000 via Nomba transfer.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6 flex flex-col justify-between gap-2.5 h-full">
                <div className="flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                  <span>Payout Bank Account</span>
                  <span className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/70 flex items-center justify-center text-[#0f172a]">
                    <Building2 className="w-3.5 h-3.5" />
                  </span>
                </div>

                {hasBankDetails ? (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#0f172a]">
                      {wallet?.bank?.bankName}
                    </p>
                    <p className="text-xs font-mono text-[#2e1065] font-semibold">
                      {wallet?.bank?.accountNumber}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {wallet?.bank?.accountName}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    No Nigerian bank account linked yet.
                  </p>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBankModalOpen(true)}
                  className="w-full"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{hasBankDetails ? "Change Bank Account" : "Link Bank Account"}</span>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Identity Verification (KYC) Card */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Identity Verification (KYC)
                    </span>
                    <Badge
                      variant={
                        isKycVerified
                          ? "success"
                          : kycStatus === "PENDING"
                          ? "warning"
                          : "secondary"
                      }
                    >
                      {isKycVerified
                        ? "Verified"
                        : kycStatus === "PENDING"
                        ? "Pending Review"
                        : kycStatus === "REJECTED"
                        ? "Rejected — Retry"
                        : "Unverified"}
                    </Badge>
                  </div>
                  {isKycVerified ? (
                    <p className="text-xs text-slate-600">
                      Verified via{" "}
                      <span className="font-semibold text-[#0f172a]">
                        {wallet?.kyc?.idType} ••••{wallet?.kyc?.idLast4}
                      </span>{" "}
                      ({wallet?.kyc?.verifiedName}). Withdrawals and Auto T+1 settlements are enabled.
                    </p>
                  ) : kycStatus === "PENDING" ? (
                    <p className="text-xs text-amber-800">
                      Your{" "}
                      <span className="font-semibold">
                        {wallet?.kyc?.idType} ••••{wallet?.kyc?.idLast4}
                      </span>{" "}
                      was verified and is awaiting quick compliance review against your payout account name.
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Verify your 11-digit NIN or BVN once to unlock instant bank withdrawals and 8:00 AM Auto T+1 payouts (auto-settlements are paused until verified).
                    </p>
                  )}
                </div>

                {!isKycVerified && kycStatus !== "PENDING" && (
                  <form
                    onSubmit={handleSubmitKyc}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0"
                  >
                    <select
                      value={kycIdType}
                      onChange={(e) =>
                        setKycIdType(e.target.value === "BVN" ? "BVN" : "NIN")
                      }
                      className="h-9 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-[#0f172a] focus:outline-none focus:border-[#2e1065]"
                    >
                      <option value="NIN">NIN</option>
                      <option value="BVN">BVN</option>
                    </select>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={11}
                      required
                      placeholder={`11-digit ${kycIdType}`}
                      value={kycIdNumber}
                      onChange={(e) =>
                        setKycIdNumber(e.target.value.replace(/\D/g, "").slice(0, 11))
                      }
                      className="h-9 w-full sm:w-44 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-[#0f172a] focus:outline-none focus:border-[#2e1065]"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={submittingKyc || kycIdNumber.length !== 11}
                    >
                      {submittingKyc ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span>Verify Identity</span>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transaction Ledger */}
          <Card>
            <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Transaction Ledger</CardTitle>
                <CardDescription>
                  Complete record of sales and bank payouts.
                </CardDescription>
              </div>
              <Badge variant="outline">
                {wallet?.transactions?.length || 0} entries
              </Badge>
            </CardHeader>

            <CardContent className="p-0">
              {!wallet?.transactions || wallet.transactions.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-[#0f172a]">
                    No financial transactions yet
                  </p>
                  <p className="text-xs text-slate-500">
                    When customers pay for orders, records appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/70">
                        <th className="py-3 px-4 font-semibold">Date</th>
                        <th className="py-3 px-4 font-semibold">Type</th>
                        <th className="py-3 px-4 font-semibold">Reference / Order</th>
                        <th className="py-3 px-4 font-semibold">Net Amount</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {wallet.transactions
                        .slice((txPage - 1) * TX_PAGE_SIZE, txPage * TX_PAGE_SIZE)
                        .map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(tx.createdAt).toLocaleDateString("en-NG", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-3.5 px-4">
                            {getTransactionBadge(tx.type)}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-mono text-[#0f172a] font-medium">
                              {tx.reference}
                            </p>
                            {tx.order && (
                              <p className="text-[10.5px] text-slate-500">
                                Order #{tx.order.orderNumber} • {tx.order.customer.fullName}
                              </p>
                            )}
                          </td>
                          <td
                            className={`py-3.5 px-4 font-mono font-bold ${
                              tx.type === "WITHDRAWAL"
                                ? "text-red-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {tx.type === "WITHDRAWAL" ? "-" : "+"}
                            {formatCurrency(tx.netAmount)}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge
                              variant={
                                tx.status === "COMPLETED"
                                  ? "success"
                                  : tx.status === "FAILED"
                                  ? "destructive"
                                  : "warning"
                              }
                            >
                              {tx.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {wallet?.transactions && wallet.transactions.length > TX_PAGE_SIZE && (
                <div className="px-4 pb-4">
                  <Pagination
                    currentPage={txPage}
                    totalItems={wallet.transactions.length}
                    pageSize={TX_PAGE_SIZE}
                    onPageChange={setTxPage}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Bank Setup Dialog */}
      <Dialog open={bankModalOpen} onOpenChange={setBankModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#2e1065]" />
              <span>{hasBankDetails ? "Change Bank Account" : "Link Payout Bank Account"}</span>
            </DialogTitle>
            <DialogDescription>
              Verify your Nigerian bank account via Nomba before saving.
            </DialogDescription>
          </DialogHeader>

          {bankError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{bankError}</span>
            </div>
          )}

          <form onSubmit={handleSaveBank} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0f172a] mb-1">
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
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#0f172a] focus:outline-none focus:border-[#2e1065]"
              >
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                10-Digit NUBAN Account Number *
              </label>
              <input
                type="text"
                maxLength={10}
                required
                placeholder="0123456789"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#0f172a] font-mono tracking-wider focus:outline-none focus:border-[#2e1065]"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs min-h-[46px] flex items-center justify-between">
              <span className="text-slate-500">Account Holder:</span>
              {verifyingBank ? (
                <div className="flex items-center gap-1.5 text-[#2e1065] font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : resolvedAccountName ? (
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <Check className="w-3.5 h-3.5" />
                  <span>{resolvedAccountName}</span>
                </div>
              ) : (
                <span className="text-slate-400">Type 10 digits to verify</span>
              )}
            </div>

            {hasBankDetails && resolvedAccountName && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                <div className="text-[11.5px] text-amber-900 leading-relaxed">
                  <strong>Security Check:</strong> Changing your payout bank account requires an email confirmation code and triggers a <strong>24-hour withdrawal lock</strong>.
                </div>

                {!otpSent ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleRequestBankOtp}
                    disabled={sendingOtp}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                  >
                    {sendingOtp ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>Send Confirmation Code to Email</span>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    {otpMessage && (
                      <p className="text-[11px] text-emerald-700 font-medium">
                        {otpMessage}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="6-digit code"
                        value={bankOtp}
                        onChange={(e) => setBankOtp(e.target.value.replace(/\D/g, ""))}
                        className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-[#0f172a] font-mono tracking-[0.25em] text-center focus:outline-none focus:border-[#2e1065]"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRequestBankOtp}
                        disabled={sendingOtp}
                      >
                        {sendingOtp ? "..." : "Resend"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={
                !resolvedAccountName ||
                savingBank ||
                (hasBankDetails && bankOtp.trim().length !== 6)
              }
              className="w-full"
            >
              {savingBank ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>
                  {hasBankDetails
                    ? "Confirm Bank Change (24h Lock)"
                    : "Save Verified Bank Details"}
                </span>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Withdraw Funds Dialog */}
      <Dialog
        open={withdrawModalOpen}
        onOpenChange={(open) => {
          setWithdrawModalOpen(open);
          if (!open) {
            setWithdrawOtp("");
            setWithdrawOtpSent(false);
            setWithdrawMaskedEmail("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-[#2e1065]" />
              <span>Withdraw to Bank Account</span>
            </DialogTitle>
            <DialogDescription>
              Funds are sent immediately via Nomba NIP transfer after email verification.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleWithdraw} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <p className="text-slate-500">Destination Account:</p>
              <p className="font-bold text-[#0f172a]">
                {wallet?.bank?.bankName} — {wallet?.bank?.accountNumber}
              </p>
              <p className="text-[11px] text-slate-500">
                {wallet?.bank?.accountName}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label className="font-semibold text-[#0f172a]">
                  Withdrawal Amount (₦) *
                </label>
                <button
                  type="button"
                  disabled={withdrawOtpSent}
                  onClick={() =>
                    setWithdrawAmount(
                      formatWithdrawInput(Math.floor(available * 100) / 100)
                    )
                  }
                  className="text-[#2e1065] hover:underline font-bold text-[11px] cursor-pointer disabled:opacity-50"
                >
                  Withdraw All ({formatCurrency(available)})
                </button>
              </div>
              <input
                type="text"
                inputMode="decimal"
                required
                disabled={withdrawOtpSent}
                placeholder="Min ₦1,000"
                value={withdrawAmount}
                onChange={(e) =>
                  setWithdrawAmount(formatWithdrawInput(e.target.value))
                }
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-[#0f172a] font-mono focus:outline-none focus:border-[#2e1065] disabled:opacity-70"
              />
            </div>

            {/* Live Payout & Fee Breakdown before OTP Authorization */}
            {parsedWithdrawAmount >= 1000 && parsedWithdrawAmount <= available && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Withdrawal Amount</span>
                  <span className="font-mono font-semibold text-[#0f172a]">
                    {formatCurrency(parsedWithdrawAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Instant Transfer Fee</span>
                  <span className="font-mono font-semibold text-rose-600">
                    -{formatCurrency(instantTransferFee)}
                  </span>
                </div>
                <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-[#0f172a]">You Will Receive</span>
                  <span className="font-display text-sm font-extrabold text-[#2e1065]">
                    {formatCurrency(netWithdrawReceive)}
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-500 pt-0.5">
                  Standard bank transfer fee applies to both instant withdrawals and 8:00 AM WAT Auto T+1 settlements.
                </p>
              </div>
            )}

            {withdrawOtpSent && (
              <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold text-[#2e1065]">
                    Enter 6-digit code sent to {withdrawMaskedEmail}
                  </p>
                  <button
                    type="button"
                    onClick={handleRequestWithdrawOtp}
                    disabled={sendingWithdrawOtp}
                    className="text-[11px] font-bold text-[#2e1065] hover:underline cursor-pointer shrink-0"
                  >
                    {sendingWithdrawOtp ? "Sending..." : "Resend"}
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="6-digit code"
                  value={withdrawOtp}
                  onChange={(e) =>
                    setWithdrawOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-purple-300 text-center text-base font-mono font-bold tracking-[0.4em] text-[#0f172a] focus:outline-none focus:border-[#2e1065]"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={
                withdrawing ||
                sendingWithdrawOtp ||
                parsedWithdrawAmount < 1000 ||
                parsedWithdrawAmount > available ||
                (withdrawOtpSent && withdrawOtp.trim().length !== 6)
              }
              className="w-full"
            >
              {withdrawing || sendingWithdrawOtp ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : withdrawOtpSent ? (
                <span>Confirm &amp; Withdraw</span>
              ) : (
                <span>Send Email Confirmation Code</span>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
