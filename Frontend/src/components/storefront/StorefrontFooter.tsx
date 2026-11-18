"use client";

import Link from "next/link";
import { getImageUrl, getStorePath } from "@/lib/utils";
import { StoreData, toSocialUrl } from "@/types/storefront";
import { MapPin, Phone, Mail } from "lucide-react";

interface StorefrontFooterProps {
  store: StoreData;
  onTrackOrder?: () => void;
  extraBottomPadding?: boolean;
}

export function StorefrontFooter({
  store,
  onTrackOrder,
  extraBottomPadding = false,
}: StorefrontFooterProps) {
  return (
    <footer
      className={`border-t border-[#daddd4] bg-white ${
        extraBottomPadding ? "pb-16 md:pb-0" : ""
      }`}
    >
      <div className="mx-auto w-[min(1180px,calc(100%-32px))] md:w-[min(1180px,calc(100%-48px))] py-7">
        {/* Row 1: Brand & Contact/Socials */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <Link
              href={getStorePath(store.slug)}
              className="inline-flex items-center gap-2.5"
            >
              {store.logoUrl ? (
                <img
                  src={getImageUrl(store.logoUrl)}
                  alt={store.name}
                  className="h-9 w-9 rounded-[6px] object-cover border border-[#daddd4]"
                />
              ) : (
                <div className="h-9 w-9 rounded-[6px] bg-[#2e1065] flex items-center justify-center font-display font-extrabold text-white text-sm">
                  {store.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-display text-sm font-extrabold uppercase tracking-tight text-[#20231e]">
                {store.name}
              </span>
            </Link>
            {store.address && (
              <p className="text-xs text-[#62665d] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#3b0764] shrink-0" />
                <span>{store.address}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs">
            {(store.contactPhone || store.whatsappNumber || store.contactEmail) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                {(store.contactPhone || store.whatsappNumber) && (
                  <a
                    href={`tel:${store.contactPhone || store.whatsappNumber}`}
                    className="font-semibold text-[#20231e] hover:text-[#2e1065] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#3b0764] shrink-0" />
                    <span>{store.contactPhone || store.whatsappNumber}</span>
                  </a>
                )}
                {store.contactEmail && (
                  <a
                    href={`mailto:${store.contactEmail}`}
                    className="font-semibold text-[#20231e] hover:text-[#2e1065] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#3b0764] shrink-0" />
                    <span>{store.contactEmail}</span>
                  </a>
                )}
              </div>
            )}

            <div className="flex items-center gap-4 flex-wrap">
              {(
                [
                  { key: "instagram", label: "Instagram" },
                  { key: "tiktok", label: "TikTok" },
                  { key: "facebook", label: "Facebook" },
                  { key: "twitter", label: "X" },
                ] as const
              ).map(({ key, label }) => {
                const href = toSocialUrl(key, store.socialLinks?.[key]);
                if (!href) return null;
                return (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#20231e] hover:text-[#2e1065] hover:underline transition-colors whitespace-nowrap"
                  >
                    {label}
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 2: Hairline Meta */}
        <div className="mt-5 pt-4 border-t border-[#e6e8e1] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#62665d]">
          <span>
            © {new Date().getFullYear()} {store.name}
          </span>
          <div className="flex items-center gap-3">
            {onTrackOrder && (
              <>
                <button
                  type="button"
                  onClick={onTrackOrder}
                  className="hover:text-[#20231e] font-medium cursor-pointer"
                >
                  Track Order
                </button>
                <span>·</span>
              </>
            )}
            <span>
              Powered by{" "}
              <a
                href="https://usekredibly.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#2e1065] hover:underline"
              >
                Kredibly
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
