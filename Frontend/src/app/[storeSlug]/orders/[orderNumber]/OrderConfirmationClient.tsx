"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { StorefrontFooter } from "@/components/storefront/StorefrontFooter";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { CheckoutDrawer } from "@/components/storefront/CheckoutDrawer";
import { StoreData } from "@/types/storefront";
import {
  CheckCircle2,
  ShieldCheck,
  MessageCircle,
  Package,
  MapPin,
  Phone,
  User,
  ArrowRight,
  Clock,
  Loader2,
} from "lucide-react";

interface OrderData {
  id: string;
  orderNumber: string;
  subtotal: number | string;
  shippingFee: number | string;
  totalAmount: number | string;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  customer: {
    fullName: string;
    phoneNumber: string;
    address: string;
    city?: string | null;
    state: string;
  };
  store: {
    name: string;
    slug: string;
    whatsappNumber: string;
    currency: string;
  };
  items: Array<{
    id: string;
    productTitle: string;
    variantName?: string | null;
    unitPrice: number | string;
    quantity: number;
    subtotal: number | string;
  }>;
}

export function OrderConfirmationClient({
  initialOrder,
  storeData,
}: {
  initialOrder: OrderData;
  storeData?: StoreData | null;
}) {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<OrderData>(initialOrder);
  const [simulating, setSimulating] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const headerStore: StoreData = storeData || {
    id: order.store.slug,
    name: order.store.name,
    slug: order.store.slug,
    whatsappNumber: order.store.whatsappNumber,
    currency: order.store.currency || "NGN",
    products: [],
  };

  // If redirected with ?simulated=true&ref=..., trigger dev simulation
  useEffect(() => {
    const isSimulated = searchParams.get("simulated");
    const ref = searchParams.get("ref");

    if (isSimulated && ref && order.paymentStatus !== "PAID") {
      setSimulating(true);
      api
        .post("/checkout/simulate-payment", { reference: ref })
        .then(() => {
          setOrder((prev) => ({
            ...prev,
            orderStatus: "PAID",
            paymentStatus: "PAID",
          }));
        })
        .catch(console.error)
        .finally(() => setSimulating(false));
    }
  }, [searchParams, order.paymentStatus]);

  const cleanPhone = order.store.whatsappNumber.replace(/\D/g, "");
  const formattedItems = order.items
    .map((i) => `${i.quantity}x ${i.productTitle}${i.variantName ? ` (${i.variantName})` : ""}`)
    .join(", ");

  const whatsappMessage = encodeURIComponent(
    `Hi ${order.store.name}! I just paid ${formatCurrency(
      order.totalAmount
    )} for Order #${order.orderNumber}.\n\nItems: ${formattedItems}\nDelivery to: ${
      order.customer.address
    }, ${order.customer.state}\nName: ${order.customer.fullName}`
  );

  const whatsappUrl = `https://wa.me/234${
    cleanPhone.startsWith("0") ? cleanPhone.slice(1) : cleanPhone
  }?text=${whatsappMessage}`;

  const isPaid = order.paymentStatus === "PAID";

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <StorefrontHeader store={headerStore} />

      {/* Main Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Status Hero Card */}
        <div className="text-center p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl flex flex-col items-center">
          {simulating ? (
            <div className="h-16 w-16 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 mb-4 animate-spin">
              <Loader2 className="w-8 h-8" />
            </div>
          ) : isPaid ? (
            <div className="h-16 w-16 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 mb-4 shadow-lg shadow-brand-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          ) : (
            <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
              <Clock className="w-10 h-10" />
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isPaid ? "Payment Confirmed!" : "Awaiting Payment"}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Order <span className="text-brand-400 font-mono font-bold">#{order.orderNumber}</span> has been received.
          </p>

          {/* Escrow Badge */}
          <div className="mt-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-brand-500 shrink-0" />
            <span>Funds held safely in Kredibly Escrow until dispatch</span>
          </div>

          {/* Primary Action: Message Seller on WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mt-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition flex items-center justify-center gap-2 text-sm shadow-xl shadow-emerald-600/20"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Message Seller on WhatsApp</span>
          </a>
        </div>

        {/* Delivery Details Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Delivery Destination
          </h3>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="font-semibold text-white">{order.customer.fullName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="font-mono">{order.customer.phoneNumber}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>
                {order.customer.address}, {order.customer.city ? `${order.customer.city}, ` : ""}
                {order.customer.state}
              </span>
            </div>
          </div>
        </div>

        {/* Order Items Breakdown */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Items Ordered ({order.items.length})
          </h3>

          <div className="space-y-3 divide-y divide-slate-800/80">
            {order.items.map((item) => (
              <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-white text-sm">{item.productTitle}</p>
                  {item.variantName && (
                    <p className="text-slate-400">{item.variantName}</p>
                  )}
                  <p className="text-slate-500 mt-0.5">
                    Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                <span className="font-extrabold text-white text-sm">
                  {formatCurrency(item.subtotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400">Total Paid</span>
            <span className="text-xl font-extrabold text-brand-400">
              {formatCurrency(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Back to store button */}
        <div className="text-center pt-2">
          <Link
            href={`/${order.store.slug}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <span>Back to {order.store.name}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>

      <StorefrontFooter store={headerStore} />
      <CartDrawer onCheckoutClick={() => setCheckoutOpen(true)} />
      <CheckoutDrawer
        storeSlug={headerStore.slug}
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
    </div>
  );
}
