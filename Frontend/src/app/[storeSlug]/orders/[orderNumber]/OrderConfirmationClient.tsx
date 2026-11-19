"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  formatCurrency,
  formatWhatsAppNumber,
  getImageUrl,
  getStorePath,
} from "@/lib/utils";
import { useShopperStore } from "@/store/useShopperStore";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { StorefrontFooter } from "@/components/storefront/StorefrontFooter";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { CheckoutDrawer } from "@/components/storefront/CheckoutDrawer";
import { StoreData } from "@/types/storefront";
import {
  CheckCircle2,
  MessageCircle,
  MapPin,
  Phone,
  User,
  ArrowRight,
  Clock,
  Loader2,
  Package,
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
    product?: {
      images?: string[];
      slug?: string;
    } | null;
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
  const { token: shopperToken, storeSlug: loadedSlug, loadShopper } =
    useShopperStore();

  useEffect(() => {
    if (loadedSlug !== order.store.slug) {
      loadShopper(order.store.slug);
    }
  }, [order.store.slug, loadedSlug, loadShopper]);

  const isShopperLoggedIn = Boolean(
    shopperToken && loadedSlug === order.store.slug
  );

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

  // Poll for payment verification if order is still UNPAID when buyer lands here
  useEffect(() => {
    if (order.paymentStatus === "PAID") return;
    const poll = async () => {
      try {
        const res = await api.get(`/checkout/orders/${order.orderNumber}`);
        if (res.data?.data) {
          setOrder(res.data.data);
        }
      } catch {
        // silent poll
      }
    };
    poll();
    const timer = setInterval(poll, 5000);
    return () => clearInterval(timer);
  }, [order.orderNumber, order.paymentStatus]);

  const whatsappNumber = formatWhatsAppNumber(order.store.whatsappNumber);
  const formattedItems = order.items
    .map((i) => `${i.quantity}x ${i.productTitle}${i.variantName ? ` (${i.variantName})` : ""}`)
    .join(", ");
  const orderReceiptUrl = `https://${order.store.slug}.kredibly.shop/orders/${order.orderNumber}`;

  const whatsappMessage = encodeURIComponent(
    `Hi ${order.store.name}! I placed Order #${order.orderNumber} (${formatCurrency(
      order.totalAmount
    )}).\n\nItems: ${formattedItems}\nDelivery to: ${
      order.customer.address
    }, ${order.customer.state}\nName: ${order.customer.fullName}\nReceipt: ${orderReceiptUrl}`
  );

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  const isPaid = order.paymentStatus === "PAID";
  const isJustConfirmed =
    searchParams.get("confirmed") === "1" ||
    searchParams.get("simulated") === "true";

  const statusMeta = (() => {
    switch (order.orderStatus) {
      case "DELIVERED":
        return {
          label: "Delivered",
          badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        };
      case "SHIPPED":
        return {
          label: "Dispatched",
          badgeClass: "bg-blue-50 text-blue-700 border border-blue-200",
        };
      case "CANCELLED":
        return {
          label: "Cancelled",
          badgeClass: "bg-rose-50 text-rose-700 border border-rose-200",
        };
      default:
        return {
          label: "Confirmed",
          badgeClass: "bg-amber-50 text-amber-700 border border-amber-200",
        };
    }
  })();

  const deliveryDestinationCard = (
    <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#daddd4] space-y-3">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#62665d]">
        Delivery Destination
      </h3>

      <div className="space-y-2 text-xs text-[#62665d]">
        <div className="flex items-center gap-2.5">
          <User className="w-4 h-4 text-[#2e1065] shrink-0" />
          <span className="font-bold text-[#20231e]">
            {order.customer.fullName}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <Phone className="w-4 h-4 text-[#2e1065] shrink-0" />
          <span className="font-mono text-[#20231e]">
            {order.customer.phoneNumber}
          </span>
        </div>
        <div className="flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-[#2e1065] shrink-0 mt-0.5" />
          <span className="text-[#20231e]">
            {order.customer.address},{" "}
            {order.customer.city ? `${order.customer.city}, ` : ""}
            {order.customer.state}
          </span>
        </div>
      </div>
    </div>
  );

  const itemsOrderedCard = (
    <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#daddd4] space-y-4">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#62665d]">
        Items Ordered ({order.items.length})
      </h3>

      <div className="space-y-3 divide-y divide-[#e6e8e1]">
        {order.items.map((item) => {
          const thumb = item.product?.images?.[0];
          return (
            <div
              key={item.id}
              className="pt-3 first:pt-0 flex items-center justify-between text-xs gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-12 w-12 rounded-lg bg-[#fafaf8] border border-[#e6e8e1] overflow-hidden shrink-0 flex items-center justify-center">
                  {thumb ? (
                    <img
                      src={getImageUrl(thumb)}
                      alt={item.productTitle}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="w-5 h-5 text-[#c5c8be]" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[#20231e] text-sm truncate">
                    {item.productTitle}
                  </p>
                  {item.variantName && (
                    <p className="text-[#62665d]">{item.variantName}</p>
                  )}
                  <p className="text-[#62665d] mt-0.5">
                    Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                  </p>
                </div>
              </div>
              <span className="font-extrabold text-[#20231e] text-sm shrink-0">
                {formatCurrency(item.subtotal)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-[#e6e8e1] flex items-center justify-between">
        <span className="text-xs sm:text-sm font-semibold text-[#62665d]">
          {isPaid ? "Total Paid" : "Amount Due"}
        </span>
        <span className="font-display text-xl font-extrabold text-[#2e1065]">
          {formatCurrency(order.totalAmount)}
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#20231e] font-sans flex flex-col">
      <StorefrontHeader store={headerStore} />

      {/* Main Content */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8 sm:py-12 space-y-5">
        {isJustConfirmed || !isPaid ? (
          <>
            {/* Status Hero Card (Immediate Post-Checkout / Awaiting Payment) */}
            <div className="text-center p-6 sm:p-8 rounded-2xl bg-white border border-[#daddd4] shadow-[0_12px_32px_-12px_rgba(32,35,30,0.06)] flex flex-col items-center">
              {simulating ? (
                <div className="h-14 w-14 rounded-2xl bg-[#2e1065]/10 flex items-center justify-center text-[#2e1065] mb-4">
                  <Loader2 className="w-7 h-7 animate-spin" />
                </div>
              ) : isPaid ? (
                <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              ) : (
                <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4">
                  <Clock className="w-8 h-8" />
                </div>
              )}

              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider mb-2 ${
                  isPaid
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {isPaid ? "Verified Receipt" : "Verifying Transfer"}
              </span>

              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#20231e] tracking-tight">
                {isPaid ? "Payment Confirmed!" : "Awaiting Payment Confirmation"}
              </h1>
              <p className="text-[#62665d] text-xs sm:text-sm mt-1">
                Order{" "}
                <span className="text-[#2e1065] font-mono font-bold">
                  #{order.orderNumber}
                </span>{" "}
                {isPaid
                  ? `has been sent to ${order.store.name}.`
                  : "will update automatically as soon as your transfer confirms."}
              </p>

              {/* Primary Action: Message Seller on WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-6 py-3.5 bg-[#2e1065] hover:bg-[#3b0764] text-white font-display font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs sm:text-sm shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Message {order.store.name} on WhatsApp</span>
              </a>

              {/* Registered Shopper vs Guest Action */}
              {isShopperLoggedIn ? (
                <Link
                  href={getStorePath(order.store.slug, "/account")}
                  className="w-full mt-2.5 py-3 bg-[#fafaf8] hover:bg-[#f3f4ef] border border-[#daddd4] text-[#20231e] font-semibold rounded-xl transition flex items-center justify-center gap-2 text-xs"
                >
                  <User className="w-4 h-4 text-[#2e1065]" />
                  <span>View Order in My Profile</span>
                </Link>
              ) : (
                <p className="text-[11px] text-[#62665d] mt-3.5">
                  Save your order number{" "}
                  <span className="font-mono font-bold text-[#20231e]">
                    #{order.orderNumber}
                  </span>{" "}
                  to track delivery anytime, or{" "}
                  <Link
                    href={getStorePath(order.store.slug, "/account/register")}
                    className="text-[#2e1065] hover:underline font-semibold"
                  >
                    create a free account
                  </Link>
                  .
                </p>
              )}
            </div>

            {itemsOrderedCard}
            {deliveryDestinationCard}
          </>
        ) : (
          <>
            {/* Order Status & Summary Header (Revisit from My Orders / Track Order) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#daddd4] shadow-[0_12px_32px_-12px_rgba(32,35,30,0.06)] space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#62665d]">
                    Order Summary
                  </p>
                  <h1 className="font-display text-xl sm:text-2xl font-extrabold text-[#20231e] tracking-tight mt-0.5 font-mono">
                    #{order.orderNumber}
                  </h1>
                  <p className="text-xs text-[#62665d] mt-0.5">
                    Placed on{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${statusMeta.badgeClass}`}
                >
                  {statusMeta.label}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#e6e8e1]">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[180px] py-2.5 px-4 bg-[#2e1065] hover:bg-[#3b0764] text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Message {order.store.name}</span>
                </a>
                {isShopperLoggedIn && (
                  <Link
                    href={getStorePath(order.store.slug, "/account")}
                    className="py-2.5 px-4 bg-[#fafaf8] hover:bg-[#f3f4ef] border border-[#daddd4] text-[#20231e] font-semibold rounded-xl transition flex items-center justify-center gap-1.5 text-xs"
                  >
                    <User className="w-3.5 h-3.5 text-[#2e1065]" />
                    <span>My Orders</span>
                  </Link>
                )}
              </div>
            </div>

            {itemsOrderedCard}
            {deliveryDestinationCard}
          </>
        )}

        {/* Back to store button */}
        <div className="text-center pt-1">
          <Link
            href={getStorePath(order.store.slug)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#62665d] hover:text-[#2e1065] transition"
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
