"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";

interface AdminTransaction {
  id: string;
  amount: number | string;
  platformFee: number | string;
  netAmount: number | string;
  type: string;
  status: string;
  reference: string;
  createdAt: string;
  wallet: {
    store: {
      name: string;
      slug: string;
      bankName?: string | null;
      accountNumber?: string | null;
    };
  };
}

export default function AdminPayoutsPage() {
  const [txs, setTxs] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/payouts?type=${typeFilter}`);
      setTxs(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0f172a] tracking-tight">
            Payouts &amp; Financial Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track platform sales, fee deductions, and merchant bank withdrawals.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPayouts}>
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {["ALL", "SALE", "WITHDRAWAL", "REFUND"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              typeFilter === t
                ? "bg-[#2e1065] text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:text-[#0f172a]"
            }`}
          >
            {t === "ALL" ? "All Transactions" : t}
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
                <th className="px-5 py-3">Reference</th>
                <th className="px-5 py-3">Store</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Gross</th>
                <th className="px-5 py-3 text-right">Fee</th>
                <th className="px-5 py-3 text-right">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {txs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                    No transactions recorded yet.
                  </td>
                </tr>
              ) : (
                txs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5 font-mono text-[11px] font-semibold text-[#0f172a]">
                      {tx.reference}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-[#0f172a]">
                        {tx.wallet?.store?.name}
                      </p>
                      {tx.type === "WITHDRAWAL" &&
                        tx.wallet?.store?.bankName && (
                          <p className="text-[11px] text-slate-500">
                            {tx.wallet.store.bankName} •{" "}
                            {tx.wallet.store.accountNumber}
                          </p>
                        )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="secondary">{tx.type}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={
                          tx.status === "COMPLETED" ? "success" : "warning"
                        }
                      >
                        {tx.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-[#0f172a]">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-500">
                      {formatCurrency(tx.platformFee)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-[#0f172a]">
                      {formatCurrency(tx.netAmount)}
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
