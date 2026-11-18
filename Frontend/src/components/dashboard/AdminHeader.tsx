"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlignJustify, ExternalLink, UserCircle, Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { getImageUrl } from "@/lib/utils";
import {
  areSaleAlertsEnabled,
  setSaleAlertsEnabled,
  playSaleChime,
  subscribeMerchantPush,
  unsubscribeMerchantPush,
} from "@/lib/notifications";
import { Button } from "@/components/ui/button";

export function AdminHeader({ setOpen }: { setOpen: (val: boolean) => void }) {
  const { user, store } = useAuthStore();
  const storeSlug = store?.slug || "mystore";
  const resolvedLogo = getImageUrl(store?.logoUrl) || "/kredibly-k-icon.png";
  const [alertsOn, setAlertsOn] = useState(true);

  useEffect(() => {
    setAlertsOn(areSaleAlertsEnabled());
  }, []);

  const handleToggleAlerts = async () => {
    const next = !alertsOn;
    setAlertsOn(next);
    setSaleAlertsEnabled(next);

    if (next) {
      playSaleChime();
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "default"
      ) {
        try {
          await Notification.requestPermission();
        } catch {
          // ignore
        }
      }
      await subscribeMerchantPush();
      toast.success("Sale alerts & notification sound enabled.");
    } else {
      await unsubscribeMerchantPush();
      toast.info("Sale alerts & sound muted.");
    }
  };

  return (
    <header className="flex items-center justify-between px-4 sm:px-8 py-3 bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setOpen(true)}
          className="lg:hidden"
        >
          <AlignJustify className="w-4 h-4 text-slate-700" />
          <span className="sr-only">Toggle Menu</span>
        </Button>

        {/* Mobile Store Name */}
        <div className="flex lg:hidden items-center gap-2 min-w-0">
          <img
            src={resolvedLogo}
            alt={store?.name || "Kredibly"}
            className="w-7 h-7 object-cover rounded-lg shrink-0"
          />
          <span className="text-xs font-bold text-[#0f172a] truncate max-w-[140px]">
            {store?.name || "My Store"}
          </span>
        </div>

        {/* Desktop Breadcrumb */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-[#0f172a]">Merchant Portal</span>
          <span>/</span>
          <span className="font-mono text-[#2e1065]">
            {storeSlug}.kredibly.shop
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleToggleAlerts}
          title={alertsOn ? "Sale alerts ON (tap to mute)" : "Sale alerts OFF (tap to enable)"}
          aria-label="Toggle sale alerts"
        >
          {alertsOn ? (
            <Bell className="w-4 h-4 text-[#2e1065]" />
          ) : (
            <BellOff className="w-4 h-4 text-slate-400" />
          )}
        </Button>

        <Link href={`/${storeSlug}`} target="_blank">
          <Button type="button" variant="outline" size="sm" className="text-xs">
            <span className="hidden sm:inline">Preview Store</span>
            <span className="sm:hidden">Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </Link>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs">
          <UserCircle className="w-4 h-4 text-[#2e1065]" />
          <span className="font-semibold text-slate-700 max-w-[130px] truncate">
            {user?.fullName || "Merchant"}
          </span>
        </div>
      </div>
    </header>
  );
}
