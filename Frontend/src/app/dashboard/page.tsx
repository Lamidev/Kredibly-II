"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { formatCurrency } from "@/lib/utils";
import {
  Copy,
  Check,
  Package,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Circle,
  ArrowRight,
  BadgeCheck,
  Users,
  Settings,
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

export default function DashboardPage() {
  const { user, store } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const storeSlug = store?.slug || "mystore";
  const storeUrl = `https://kredibly.shop/${storeSlug}`;
  const hasBankDetails = Boolean(store?.accountNumber && store?.bankName);

  const copyStoreLink = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    toast.success("Store link copied! Share it on WhatsApp or Instagram.");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
            Welcome back, {user?.fullName?.split(" ")[0] || "Merchant"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your products, track customer orders, and withdraw your sales.
          </p>
        </div>
        <Badge variant="success" className="w-fit">
          <ShieldCheck className="w-3.5 h-3.5" />
          Storefront Live
        </Badge>
      </div>

      {/* Store Bio Link Card */}
      <Card className="border-[#2e1065]/15 bg-gradient-to-r from-white via-white to-[#2e1065]/[0.04]">
        <CardContent className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#2e1065]">
              Your Official Store Link
            </p>
            <h2 className="text-lg font-extrabold text-[#0f172a]">
              Share this link on WhatsApp &amp; Instagram
            </h2>
            <p className="text-xs text-slate-500">
              Customers can browse your products, add to cart, and pay online in 1 step.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto min-w-0">
            <div className="min-w-0 flex-1 md:flex-initial px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs sm:text-sm text-[#2e1065] font-semibold select-all truncate sm:max-w-xs">
              {storeUrl}
            </div>
            <Button onClick={copyStoreLink} size="default" className="shrink-0 w-full sm:w-auto">
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dashboard/wallet">
          <Card className="hover:border-[#2e1065]/30 transition-all h-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardDescription className="uppercase tracking-wider font-semibold text-[11px]">
                Available to Withdraw
              </CardDescription>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-extrabold text-[#0f172a]">
                {formatCurrency(store?.wallet?.availableBalance || 0)}
              </p>
              <p className="text-[11.5px] text-slate-500 mt-1 flex items-center gap-1">
                <span>Withdraw to bank</span>
                <ArrowRight className="w-3 h-3" />
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/wallet">
          <Card className="hover:border-[#2e1065]/30 transition-all h-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardDescription className="uppercase tracking-wider font-semibold text-[11px]">
                In Escrow (Safe Hold)
              </CardDescription>
              <ShieldCheck className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-extrabold text-amber-600">
                {formatCurrency(store?.wallet?.escrowBalance || 0)}
              </p>
              <p className="text-[11.5px] text-slate-500 mt-1 flex items-center gap-1">
                <span>Releases after delivery</span>
                <ArrowRight className="w-3 h-3" />
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/products">
          <Card className="hover:border-[#2e1065]/30 transition-all h-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardDescription className="uppercase tracking-wider font-semibold text-[11px]">
                Product Catalog
              </CardDescription>
              <Package className="w-4 h-4 text-[#2e1065]" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-extrabold text-[#0f172a]">
                Manage Goods
              </p>
              <p className="text-[11.5px] text-slate-500 mt-1 flex items-center gap-1">
                <span>Add, edit, or hide products</span>
                <ArrowRight className="w-3 h-3" />
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Setup Checklist */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>2-Minute Store Setup</CardTitle>
          <CardDescription>
            Complete these 3 simple steps to start receiving paid orders.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-3 min-w-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#0f172a]">
                  Claim your unique store link
                </p>
                <p className="text-xs text-slate-500 truncate">
                  <span className="font-mono text-[#2e1065]">
                    kredibly.shop/{storeSlug}
                  </span>{" "}
                  is active.
                </p>
              </div>
            </div>
            <Badge variant="success" className="w-fit shrink-0">Done</Badge>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-3 min-w-0">
              {hasBankDetails ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-amber-500 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#0f172a]">
                  Link your payout bank account
                </p>
                <p className="text-xs text-slate-500 break-words">
                  {hasBankDetails
                    ? `${store?.bankName} • ${store?.accountNumber} (${store?.accountName})`
                    : "Add your Nigerian bank account to withdraw your sales."}
                </p>
              </div>
            </div>
            <Link href="/dashboard/wallet" className="shrink-0">
              <Button size="sm" variant={hasBankDetails ? "outline" : "default"} className="w-full sm:w-auto">
                {hasBankDetails ? "Manage" : "Add Bank"}
              </Button>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-3 min-w-0">
              <Circle className="w-5 h-5 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#0f172a]">
                  Add your first product
                </p>
                <p className="text-xs text-slate-500">
                  Upload photos, set your price, and share the link.
                </p>
              </div>
            </div>
            <Link href="/dashboard/products" className="shrink-0">
              <Button size="sm" variant="outline" className="w-full sm:w-auto">
                Go to Products
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dashboard/orders">
          <Card className="hover:border-[#2e1065]/30 transition-all">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2e1065]/10 text-[#2e1065] flex items-center justify-center shrink-0">
                <BadgeCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0f172a]">Orders</p>
                <p className="text-xs text-slate-500">Track &amp; ship orders</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/customers">
          <Card className="hover:border-[#2e1065]/30 transition-all">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0f172a]">Customers</p>
                <p className="text-xs text-slate-500">Buyer purchase history</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/settings">
          <Card className="hover:border-[#2e1065]/30 transition-all">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0f172a]">Settings</p>
                <p className="text-xs text-slate-500">Logo, bio &amp; WhatsApp</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
