import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderConfirmationClient } from "./OrderConfirmationClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function getOrder(orderNumber: string) {
  try {
    const res = await fetch(`${API_URL}/checkout/orders/${orderNumber}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { orderNumber: string };
}): Promise<Metadata> {
  return {
    title: `Order #${params.orderNumber} Receipt — Kredibly`,
    description: "Your order receipt and delivery status on Kredibly.",
  };
}

export default async function OrderPage({
  params,
}: {
  params: { storeSlug: string; orderNumber: string };
}) {
  const order = await getOrder(params.orderNumber);

  if (!order) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-xs">
          Loading order details...
        </div>
      }
    >
      <OrderConfirmationClient initialOrder={order} />
    </Suspense>
  );
}
