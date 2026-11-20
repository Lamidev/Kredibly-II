"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import { subscribeAdminPush, unsubscribeAdminPush } from "@/lib/notifications";
import { SuperAdminSidebar } from "@/components/admin/SuperAdminSidebar";
import { Menu, Loader2, Bell, BellOff, X } from "lucide-react";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { token, user, updateUser, initialize } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pushGranted, setPushGranted] = useState(true);
  const [pushBannerMode, setPushBannerMode] = useState<"hidden" | "enable" | "ios_pwa">("hidden");

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const verifyAdmin = async () => {
      const savedToken =
        token ||
        (typeof window !== "undefined"
          ? localStorage.getItem("kredibly_auth_token")
          : null);
      if (!savedToken) {
        router.replace("/login");
        return;
      }

      try {
        const res = await api.get("/auth/me");
        const me = res.data.data;
        if (me) {
          updateUser(me);
        }
        if (me?.role !== "ADMIN") {
          router.replace("/dashboard");
          return;
        }
        setChecking(false);
      } catch {
        router.replace("/login");
      }
    };

    verifyAdmin();
  }, [token, router, updateUser]);

  useEffect(() => {
    if (checking || typeof window === "undefined") return;
    if ("Notification" in window) {
      const granted = Notification.permission === "granted";
      setPushGranted(granted);
      if (granted) {
        subscribeAdminPush();
      }
    }

    if (localStorage.getItem("kredibly_admin_push_banner_dismissed") === "1") return;
    const ua = window.navigator.userAgent || "";
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isIos && !isStandalone) {
      setPushBannerMode("ios_pwa");
      return;
    }

    if ("Notification" in window && Notification.permission === "default") {
      setPushBannerMode("enable");
    }
  }, [checking]);

  const handleEnableAdminPush = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      if (Notification.permission === "granted") {
        await unsubscribeAdminPush();
        setPushGranted(false);
        toast.info("Kredibly HQ push alerts paused on this device.");
        return;
      }
      const perm = await Notification.requestPermission();
      setPushGranted(perm === "granted");
      if (perm === "granted") {
        await subscribeAdminPush();
        setPushBannerMode("hidden");
        toast.success("Kredibly HQ push alerts enabled!");
      } else if (perm === "denied") {
        setPushBannerMode("hidden");
        toast.error("Notifications are blocked in your browser settings.");
      }
    } catch {
      // ignore
    }
  };

  if (checking || user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#2e1065]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#0f172a] font-sans flex">
      <SuperAdminSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-display text-sm font-bold text-[#0f172a]">
            Kredibly HQ
          </span>
          <button
            type="button"
            onClick={handleEnableAdminPush}
            aria-label={pushGranted ? "HQ Push Alerts Active" : "Enable HQ Push Alerts"}
            className={`relative p-2 rounded-lg transition cursor-pointer ${
              pushGranted
                ? "text-[#2e1065] hover:bg-slate-100"
                : "text-slate-400 hover:bg-slate-100"
            }`}
          >
            {pushGranted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            {!pushGranted && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
            )}
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-5">
          {pushBannerMode !== "hidden" && (
            <div className="rounded-xl border border-[#2e1065]/20 bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-[#0f172a]">
                <Bell className="w-4 h-4 text-[#2e1065] shrink-0" />
                {pushBannerMode === "ios_pwa" ? (
                  <span>
                    Add <strong>Kredibly HQ</strong> to your iPhone Home Screen (<strong>Share → Add to Home Screen</strong>) to receive HQ push alerts.
                  </span>
                ) : (
                  <span>
                    Enable <strong>Kredibly HQ Push Alerts</strong> for new stores, paid plans, KYC reviews, and daily 8 AM summaries.
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {pushBannerMode === "enable" && (
                  <button
                    type="button"
                    onClick={handleEnableAdminPush}
                    className="px-3 py-1.5 rounded-lg bg-[#2e1065] hover:bg-[#3b0764] text-white text-xs font-semibold cursor-pointer"
                  >
                    Enable Alerts
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("kredibly_admin_push_banner_dismissed", "1");
                    setPushBannerMode("hidden");
                  }}
                  aria-label="Dismiss"
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
