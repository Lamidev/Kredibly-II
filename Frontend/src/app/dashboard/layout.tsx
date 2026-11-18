"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  areSaleAlertsEnabled,
  playSaleChime,
  subscribeMerchantPush,
} from "@/lib/notifications";
import { useAuthStore } from "@/store/useAuthStore";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { AdminHeader } from "@/components/dashboard/AdminHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, user, initialize, updateStore } = useAuthStore();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [checking, setChecking] = useState(true);
  const seenPaidIdsRef = useRef<Set<string> | null>(null);

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
      api
        .get("/auth/me")
        .then((res) => {
          const primaryStore = res.data?.data?.stores?.[0];
          if (primaryStore) updateStore(primaryStore);
        })
        .catch(() => {});
    }
  }, [initialize, router, updateStore]);

  // Poll for newly paid orders while merchant is in the dashboard (alerts auto-ON unless muted)
  useEffect(() => {
    if (checking) return;
    if (areSaleAlertsEnabled()) {
      subscribeMerchantPush();
    }

    const checkNewPaidOrders = async () => {
      try {
        const res = await api.get("/orders");
        const orders: any[] = res.data?.data || [];
        const paidOrders = orders.filter((o) => o.paymentStatus === "PAID");

        if (seenPaidIdsRef.current === null) {
          seenPaidIdsRef.current = new Set(paidOrders.map((o) => o.id));
          return;
        }

        const freshOrders = paidOrders.filter(
          (o) => !seenPaidIdsRef.current!.has(o.id)
        );

        if (freshOrders.length > 0) {
          freshOrders.forEach((o) => seenPaidIdsRef.current!.add(o.id));

          if (areSaleAlertsEnabled()) {
            playSaleChime();
            const latest = freshOrders[0];
            const amountText = formatCurrency(latest.totalAmount);
            const buyerName = latest.customer?.fullName || "a customer";

            toast.success(`New Paid Order #${latest.orderNumber}`, {
              description: `${amountText} from ${buyerName}`,
              action: {
                label: "View",
                onClick: () => router.push("/dashboard/orders"),
              },
            });

            if (
              typeof window !== "undefined" &&
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification(`New Paid Order #${latest.orderNumber}`, {
                body: `${amountText} from ${buyerName}`,
              });
            }
          }
        }
      } catch {
        // silent poll
      }
    };

    checkNewPaidOrders();
    const interval = setInterval(checkNewPaidOrders, 15000);
    return () => clearInterval(interval);
  }, [checking, router]);

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
