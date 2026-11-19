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
  const [pushGranted, setPushGranted] = useState(true);

  useEffect(() => {
    setAlertsOn(areSaleAlertsEnabled());
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushGranted(Notification.permission === "granted");
    }
    const syncPermission = () => {
      setAlertsOn(areSaleAlertsEnabled());
      if (typeof window !== "undefined" && "Notification" in window) {
        setPushGranted(Notification.permission === "granted");
      }
    };
    window.addEventListener("kredibly-alerts-changed", syncPermission);
    return () => window.removeEventListener("kredibly-alerts-changed", syncPermission);
  }, []);

  const handleToggleAlerts = async () => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission !== "granted"
    ) {
      try {
        const perm = await Notification.requestPermission();
        setPushGranted(perm === "granted");
        if (perm === "granted") {
          setAlertsOn(true);
          setSaleAlertsEnabled(true);
          playSaleChime();
          await subscribeMerchantPush();
          toast.success("Phone push alerts & sale sound enabled!");
          return;
        }
        if (perm === "denied") {
          toast.error(
            "Notifications are blocked in your browser settings. Enable them in site settings to get order alerts."
          );
          return;
        }
      } catch {
        // ignore
      }
    }

    const next = !alertsOn;
    setAlertsOn(next);
    setSaleAlertsEnabled(next);

    if (next) {
      playSaleChime();
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
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="lg:hidden p-1.5 -ml-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          aria-label="Toggle Menu"
        >
          <AlignJustify className="w-5 h-5" />
        </button>

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

      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={handleToggleAlerts}
          title={
            !pushGranted
              ? "Tap to activate push notifications for new orders"
              : alertsOn
              ? "Sale alerts ON (tap to mute)"
              : "Sale alerts OFF (tap to enable)"
          }
          aria-label="Toggle sale alerts"
          className="relative p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer inline-flex items-center gap-1.5"
        >
          {alertsOn && pushGranted ? (
            <Bell className="w-5 h-5 text-[#2e1065]" />
          ) : (
            <BellOff className="w-5 h-5 text-slate-400" />
          )}
          {!pushGranted && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
          )}
        </button>

        <Link
          href={`/${storeSlug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0f172a] hover:text-[#2e1065] transition"
        >
          <span className="hidden sm:inline">Preview Store</span>
          <span className="sm:hidden">Store</span>
          <ExternalLink className="w-3.5 h-3.5" />
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
