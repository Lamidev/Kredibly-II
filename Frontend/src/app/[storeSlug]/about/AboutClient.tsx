"use client";

import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { StoreData, toSocialUrl } from "@/types/storefront";
import { getImageUrl, getStorePath } from "@/lib/utils";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { StorefrontFooter } from "@/components/storefront/StorefrontFooter";
import { CheckoutDrawer } from "@/components/storefront/CheckoutDrawer";
import { FloatingWhatsApp } from "@/components/storefront/FloatingWhatsApp";
import {
  BadgeCheck,
  MapPin,
  Mail,
  Phone,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export function AboutClient({ store }: { store: StoreData }) {
  const { isOpen: cartOpen, closeCart } = useCartStore();
  const story =
    store.aboutText?.trim() ||
    store.description?.trim() ||
    `Welcome to ${store.name}. We are committed to providing quality products, transparent pricing, and fast, reliable delivery across Nigeria.`;

  const socialEntries = [
    { label: "Instagram", value: store.socialLinks?.instagram, key: "instagram" as const },
    { label: "TikTok", value: store.socialLinks?.tiktok, key: "tiktok" as const },
    { label: "Facebook", value: store.socialLinks?.facebook, key: "facebook" as const },
    { label: "Twitter / X", value: store.socialLinks?.twitter, key: "twitter" as const },
  ].filter((item) => Boolean(item.value?.trim()));

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf8] text-[#20231e]">
      <StorefrontHeader store={store} />

      <main className="flex-1 mx-auto w-[min(920px,calc(100%-24px))] md:w-[min(920px,calc(100%-48px))] py-8 sm:py-14 space-y-8">
        {/* Hero / Brand Intro */}
        <section className="bg-white border border-[#daddd4] rounded-2xl p-6 sm:p-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
            {store.logoUrl ? (
              <img
                src={getImageUrl(store.logoUrl)}
                alt={store.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-[#daddd4] shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#2e1065] text-white font-display font-extrabold text-2xl flex items-center justify-center shrink-0">
                {store.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="space-y-1.5 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Kredibly Store</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#20231e]">
                About {store.name}
              </h1>
              {store.description && store.aboutText && (
                <p className="text-sm text-[#62665d]">{store.description}</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#e6e8e1]">
            <p className="text-sm sm:text-base leading-relaxed text-[#20231e] whitespace-pre-line">
              {story}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={getStorePath(store.slug, "/products")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2e1065] hover:bg-[#3b0764] text-white text-xs sm:text-sm font-semibold transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Browse Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Contact & Store Details */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-[#daddd4] rounded-2xl p-5 sm:p-6 space-y-3">
            <h2 className="text-sm font-bold text-[#20231e]">Contact &amp; Location</h2>
            <div className="space-y-2.5 text-xs sm:text-sm text-[#62665d]">
              {store.address && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#2e1065] shrink-0 mt-0.5" />
                  <span>{store.address}</span>
                </div>
              )}
              {(store.contactPhone || store.whatsappNumber) && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#2e1065] shrink-0" />
                  <span className="font-mono">
                    {store.contactPhone || store.whatsappNumber}
                  </span>
                </div>
              )}
              {store.contactEmail && (
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#2e1065] shrink-0" />
                  <a
                    href={`mailto:${store.contactEmail}`}
                    className="hover:text-[#2e1065] underline underline-offset-2"
                  >
                    {store.contactEmail}
                  </a>
                </div>
              )}
              {!store.address && !store.contactEmail && !store.contactPhone && !store.whatsappNumber && (
                <p>Reach us directly through our storefront checkout or order tracking.</p>
              )}
            </div>

            {socialEntries.length > 0 && (
              <div className="pt-3 border-t border-[#e6e8e1] flex flex-wrap gap-2">
                {socialEntries.map((item) => {
                  const href = toSocialUrl(item.key, item.value);
                  if (!href) return null;
                  return (
                    <a
                      key={item.key}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-[#f3f4ef] hover:bg-[#e6e8e1] border border-[#daddd4] text-xs font-semibold text-[#20231e] transition-colors"
                    >
                      {item.label}
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white border border-[#daddd4] rounded-2xl p-5 sm:p-6 space-y-3">
            <h2 className="text-sm font-bold text-[#20231e] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2e1065]" />
              <span>Shop with Confidence</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#62665d] leading-relaxed">
              Orders placed on {store.name} are backed by instant order receipts, live order tracking, and direct merchant support.
            </p>
            {typeof store.verifiedOrdersCount === "number" && store.verifiedOrdersCount > 0 && (
              <p className="text-xs font-semibold text-[#2e1065]">
                {store.verifiedOrdersCount.toLocaleString()} verified paid{" "}
                {store.verifiedOrdersCount === 1 ? "order" : "orders"} completed
              </p>
            )}
          </div>
        </section>
      </main>

      <StorefrontFooter store={store} />
      <CheckoutDrawer
        storeSlug={store.slug}
        shippingConfig={store.shippingConfig}
        subscriptionTier={store.subscriptionTier}
        passFeeToCustomer={store.passFeeToCustomer}
        isOpen={cartOpen}
        onClose={closeCart}
      />
      <FloatingWhatsApp store={store} />
    </div>
  );
}
