"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import { SuperAdminSidebar } from "@/components/admin/SuperAdminSidebar";
import { Menu, Loader2 } from "lucide-react";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { token, user, updateUser, initialize } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

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
          <div className="w-9" />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
