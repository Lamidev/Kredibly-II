"use client";

import { MessageCircle } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { formatWhatsAppNumber } from "@/lib/utils";
import { StoreData } from "@/types/storefront";

export function FloatingWhatsApp({ store }: { store: StoreData }) {
  const itemCount = useCartStore((s) => s.items.length);
  const waNumber = formatWhatsAppNumber(store.whatsappNumber);

  if (!waNumber) return null;

  const message = encodeURIComponent(
    `Hi ${store.name}, I'm browsing your store and have a quick question.`
  );
  const href = `https://wa.me/${waNumber}?text=${message}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with ${store.name} on WhatsApp`}
      className={`fixed right-4 sm:right-6 z-30 inline-flex items-center gap-2 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-lg shadow-emerald-950/20 transition-all active:scale-95 ${
        itemCount > 0 ? "bottom-20 sm:bottom-6" : "bottom-5 sm:bottom-6"
      } h-11 w-11 sm:w-auto sm:px-4 justify-center`}
    >
      <MessageCircle className="w-5 h-5 shrink-0" />
      <span className="hidden sm:inline text-xs font-bold tracking-tight">
        Chat on WhatsApp
      </span>
    </a>
  );
}
