import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderConfirmationClient } from "./OrderConfirmationClient";

export const dynamic = "force-dynamic";

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

async function getStore(storeSlug: string) {
  try {
    const res = await fetch(`${API_URL}/public/stores/${storeSlug}`, {
      next: { revalidate: 30 },
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
  params: { storeSlug: string; orderNumber: string };
}): Promise<Metadata> {
  const order = await getOrder(params.orderNumber);
  const firstImageRaw = order?.items?.[0]?.product?.images?.[0];
  const base = API_URL.replace(/\/api\/?$/, "").replace(/\/+$/, "");
  const ogImage = firstImageRaw
    ? firstImageRaw.startsWith("http")
      ? firstImageRaw
      : `${base}${firstImageRaw.startsWith("/") ? "" : "/"}${firstImageRaw}`
    : undefined;
  const itemsText = order?.items
    ?.map((i: any) => `${i.quantity}x ${i.productTitle}`)
    .join(", ");
  const title = order
    ? `Order #${order.orderNumber} — ${order.store?.name || "Kredibly"}`
    : `Order #${params.orderNumber} Receipt — Kredibly`;
  const description = itemsText
    ? `Items: ${itemsText}`
    : "Your order receipt and delivery status on Kredibly.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://${params.storeSlug}.kredibly.shop/orders/${params.orderNumber}`,
      images: ogImage ? [{ url: ogImage }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function OrderPage({
  params,
}: {
  params: { storeSlug: string; orderNumber: string };
}) {
  const [order, store] = await Promise.all([
    getOrder(params.orderNumber),
    getStore(params.storeSlug),
  ]);

  if (!order) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fafaf8] text-[#20231e] flex items-center justify-center text-xs">
          Loading order details...
        </div>
      }
    >
      <OrderConfirmationClient initialOrder={order} storeData={store} />
    </Suspense>
  );
}
