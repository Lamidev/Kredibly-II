"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { getImageUrl } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingBasket,
  BadgeCheck,
  Users,
  Truck,
  Wallet,
  Settings,
  Copy,
  LogOut,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const MENU_ITEMS = [
  {
    id: "overview",
    label: "Overview",
    path: "/dashboard",
    exact: true,
    icon: LayoutDashboard,
  },
  {
    id: "products",
    label: "Products",
    path: "/dashboard/products",
    icon: ShoppingBasket,
  },
  {
    id: "orders",
    label: "Orders",
    path: "/dashboard/orders",
    icon: BadgeCheck,
  },
  {
    id: "customers",
    label: "Customers",
    path: "/dashboard/customers",
    icon: Users,
  },
  {
    id: "delivery",
    label: "Delivery & Promos",
    path: "/dashboard/delivery",
    icon: Truck,
  },
  {
    id: "wallet",
    label: "Wallet & Payouts",
    path: "/dashboard/wallet",
    icon: Wallet,
  },
  {
    id: "settings",
    label: "Store Settings",
    path: "/dashboard/settings",
    icon: Settings,
  },
];

function BrandHeader({
  storeName,
  storeSlug,
  logoUrl,
}: {
  storeName?: string;
  storeSlug?: string;
  logoUrl?: string | null;
}) {
  const resolvedLogo = getImageUrl(logoUrl) || "/kredibly-k-icon.png";
  return (
    <Link href="/dashboard" className="flex items-center gap-3 group select-none py-1">
      <img
        src={resolvedLogo}
        alt={storeName || "Kredibly"}
        className="w-10 h-10 object-cover rounded-xl border border-slate-200 bg-white shadow-2xs group-hover:scale-105 transition-transform shrink-0"
      />
      <div className="flex flex-col min-w-0">
        <span className="text-[14.5px] leading-tight font-extrabold text-[#0f172a] tracking-tight truncate">
          {storeName || "My Store"}
        </span>
        <span className="text-[11px] font-mono font-medium text-[#2e1065] truncate">
          {storeSlug || "store"}.kredibly.shop
        </span>
      </div>
    </Link>
  );
}

function SidebarContent({
  onNavigate,
  onRequestLogout,
}: {
  onNavigate?: () => void;
  onRequestLogout: () => void;
}) {
  const pathname = usePathname();
  const { store } = useAuthStore();

  const storeSlug = store?.slug || "mystore";
  const storeUrl = `https://${storeSlug}.kredibly.shop`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    toast.success("Store link copied to clipboard!");
  };

  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        <BrandHeader
          storeName={store?.name}
          storeSlug={storeSlug}
          logoUrl={store?.logoUrl}
        />

        <nav className="mt-7 flex flex-col gap-1.5">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.path
              : pathname.startsWith(item.path);

            return (
              <Link
                key={item.id}
                href={item.path}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-semibold transition-all ${
                  isActive
                    ? "bg-[#2e1065] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-[#0f172a]"
                }`}
              >
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 ${
                    isActive ? "text-white" : "text-slate-500"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="pt-4 mt-6 border-t border-slate-200 flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="w-full justify-start gap-2.5 text-xs font-semibold text-slate-700"
        >
          <Copy className="w-4 h-4 text-[#2e1065]" />
          <span>Copy Store Link</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRequestLogout}
          className="w-full justify-start gap-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );
}

export function AdminSidebar({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
}) {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const confirmLogout = () => {
    logout();
    setLogoutDialogOpen(false);
    setOpen(false);
    toast.success("Signed out successfully.");
    router.push("/login");
  };

  return (
    <>
      {/* Mobile Slide-Out Drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-5 flex flex-col">
          <SheetHeader className="sr-only">
            <SheetTitle>Merchant Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent
            onNavigate={() => setOpen(false)}
            onRequestLogout={() => {
              setOpen(false);
              setLogoutDialogOpen(true);
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-5 py-6 sticky top-0 h-screen overflow-y-auto">
        <SidebarContent onRequestLogout={() => setLogoutDialogOpen(true)} />
      </aside>

      {/* Sign Out Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign out of your store?</DialogTitle>
            <DialogDescription>
              You can sign back in anytime with your email or phone number.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLogoutDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={confirmLogout}
            >
              Yes, Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
