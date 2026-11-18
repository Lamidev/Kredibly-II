"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface KycStore {
  id: string;
  name: string;
  slug: string;
  kycStatus: string;
  kycIdType?: string | null;
  kycIdLast4?: string | null;
  kycVerifiedName?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  owner: {
    fullName: string;
    email: string;
    phoneNumber: string;
  };
}

export default function AdminKycPage() {
  const [stores, setStores] = useState<KycStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchKyc = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/kyc?status=${statusFilter}`);
      setStores(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKyc();
  }, [statusFilter]);

  const handleDecision = async (
    storeId: string,
    status: "VERIFIED" | "REJECTED"
  ) => {
    try {
      await api.patch(`/admin/kyc/${storeId}`, { status });
      setStores((prev) =>
        prev.map((s) => (s.id === storeId ? { ...s, kycStatus: status } : s))
      );
      toast.success(`KYC marked as ${status}.`);
    } catch {
      toast.error("Failed to update KYC status.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0f172a] tracking-tight">
            KYC &amp; Identity Review
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Verify merchant identities against their linked payout bank accounts.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchKyc}>
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {["ALL", "PENDING", "VERIFIED", "UNVERIFIED", "REJECTED"].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              statusFilter === st
                ? "bg-[#2e1065] text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:text-[#0f172a]"
            }`}
          >
            {st === "ALL" ? "All Stores" : st}
          </button>
        ))}
      </div>

      <Card className="overflow-x-auto">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#2e1065]" />
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Store / Owner</th>
                <th className="px-5 py-3">Submitted ID</th>
                <th className="px-5 py-3">Payout Bank Account</th>
                <th className="px-5 py-3">KYC Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stores.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                    No KYC records found.
                  </td>
                </tr>
              ) : (
                stores.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-[#0f172a]">{s.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {s.owner.fullName} • {s.owner.email}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      {s.kycIdType ? (
                        <div>
                          <p className="font-semibold text-[#0f172a]">
                            {s.kycIdType} •••• {s.kycIdLast4}
                          </p>
                          {s.kycVerifiedName && (
                            <p className="text-[11px] text-slate-500">
                              {s.kycVerifiedName}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">Not submitted</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {s.bankName ? (
                        <div>
                          <p className="font-medium text-[#0f172a]">
                            {s.accountName}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {s.bankName} • {s.accountNumber}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400">No bank linked</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={
                          s.kycStatus === "VERIFIED"
                            ? "success"
                            : s.kycStatus === "REJECTED"
                            ? "destructive"
                            : "warning"
                        }
                      >
                        {s.kycStatus}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDecision(s.id, "VERIFIED")}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Approve</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDecision(s.id, "REJECTED")}
                        >
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                          <span>Reject</span>
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
    </div>
  );
}
