"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { AdminHeader } from "@/components/dashboard/AdminHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, user, initialize } = useAuthStore();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    initialize();
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("kredibly_auth_token")
        : null;
    if (!token) {
      router.replace("/login");
    } else {
      setChecking(false);
    }
  }, [initialize, router]);

  if (checking || (!isAuthenticated && !user)) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#2e1065]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#FAF9F5] text-[#0f172a]">
      <AdminSidebar open={openSidebar} setOpen={setOpenSidebar} />
      <div className="flex flex-1 flex-col min-w-0">
        <AdminHeader setOpen={setOpenSidebar} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
