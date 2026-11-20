"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import {
  LayoutDashboard,
  Store,
  BadgeCheck,
  Wallet,
  ShieldCheck,
  CreditCard,
  LogOut,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const ADMIN_ITEMS = [
  {
    id: "overview",
    label: "Overview",
    path: "/admin",
    exact: true,
    icon: LayoutDashboard,
  },
  {
    id: "stores",
    label: "Stores & Merchants",
    path: "/admin/stores",
    icon: Store,
  },
  {
    id: "subscriptions",
    label: "Subscriptions",
    path: "/admin/subscriptions",
    icon: CreditCard,
  },
  {
    id: "orders",
    label: "All Orders",
    path: "/admin/orders",
    icon: BadgeCheck,
  },
  {
    id: "payouts",
    label: "Payouts & Ledger",
    path: "/admin/payouts",
    icon: Wallet,
  },
  {
    id: "kyc",
    label: "KYC Queue",
    path: "/admin/kyc",
    icon: ShieldCheck,
  },
];

export function SuperAdminSidebar({
  mobileOpen,
  onMobileClose,
}: {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between py-6 px-4 bg-white">
      <div className="space-y-6">
        {/* Brand */}
        <div className="px-2 space-y-1.5">
          <img
            src="/krediblyrevamped.png"
            alt="Kredibly HQ"
            className="h-7 w-auto object-contain"
          />
          <div className="min-w-0">
            <p className="font-display text-xs font-bold text-[#2e1065] tracking-tight truncate">
              Kredibly HQ
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {user?.email || "Platform Control"}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {ADMIN_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.path
              : pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.path}
                onClick={onMobileClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-[#2e1065] text-white"
                    : "text-slate-600 hover:text-[#0f172a] hover:bg-slate-100"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Actions */}
      <div className="space-y-2 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-200 bg-white min-h-screen sticky top-0 h-screen">
        {navContent}
      </aside>

      <Sheet
        open={Boolean(mobileOpen)}
        onOpenChange={(open) => !open && onMobileClose?.()}
      >
        <SheetContent side="left" className="p-0 w-72">
          <SheetHeader className="sr-only">
            <SheetTitle>Admin Navigation</SheetTitle>
          </SheetHeader>
          {navContent}
        </SheetContent>
      </Sheet>
    </>
  );
}
