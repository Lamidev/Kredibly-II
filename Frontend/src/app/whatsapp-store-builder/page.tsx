import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";

export const metadata: Metadata = {
  title: "WhatsApp Store Builder in Nigeria — Turn Chats Into Paid Orders | Kredibly",
  description:
    "Build a free WhatsApp store in Nigeria in 2 minutes. Share one clean link on your WhatsApp status and DMs so buyers can browse, add to cart, and pay online via Nomba.",
  alternates: {
    canonical: "https://usekredibly.com/whatsapp-store-builder",
  },
  openGraph: {
    title: "WhatsApp Store Builder in Nigeria | Kredibly",
    description:
      "Stop replying 'DM for price' all day. Launch a free WhatsApp storefront in 2 minutes and accept online payments in Naira.",
    url: "https://usekredibly.com/whatsapp-store-builder",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WhatsApp Store Builder in Nigeria | Kredibly",
    description:
      "Turn WhatsApp status views and DMs into structured orders with built-in Naira checkout.",
  },
};

export default function WhatsAppStoreBuilderPage() {
  return (
    <SeoLandingPage
      slug="/whatsapp-store-builder"
      eyebrow="WhatsApp Store Builder"
      title="Turn your WhatsApp status and DMs into an official online store"
      subtitle="Stop sending 20 photos and typing prices manually for every buyer. With Kredibly, you get one fast link where customers browse your catalog, pick variants, and pay online in Naira."
      ctaLabel="Create Your WhatsApp Store Free"
      highlightsTitle="Built for Nigerian WhatsApp vendors"
      highlights={[
        {
          title: "One link for WhatsApp Status & Bio",
          description:
            "Drop your Kredibly storefront link on your WhatsApp Status, Business profile, and broadcast lists so buyers see live prices and stock immediately.",
        },
        {
          title: "Structured carts instead of messy DMs",
          description:
            "Customers select sizes, colors, and quantities themselves—no more screenshots, lost addresses, or miscalculated totals.",
        },
        {
          title: "Instant checkout & payouts via Nomba",
          description:
            "Accept bank transfers and card payments directly at checkout, with automatic order receipts and clean payout tracking.",
        },
      ]}
      comparisonTitle="Kredibly vs. Manual WhatsApp Selling"
      comparisonSubtitle="See how a structured Kredibly storefront saves hours every week and increases buyer trust."
      otherColumnLabel="Manual WhatsApp DMs"
      comparisonRows={[
        {
          feature: "Product catalog & prices",
          kredibly: "Always live, searchable, with variants & stock",
          other: "Resending photos and typing prices repeatedly",
        },
        {
          feature: "Checkout & payment",
          kredibly: "Instant online checkout powered by Nomba",
          other: "Sending account numbers & waiting for fake alerts",
        },
        {
          feature: "Order tracking",
          kredibly: "Every order & delivery address saved in dashboard",
          other: "Scrolling back through hundreds of chat threads",
        },
        {
          feature: "Starting cost",
          kredibly: "₦0/month Starter plan (up to 10 products)",
          other: "Hours of manual admin every day",
        },
      ]}
      stepsTitle="Launch your WhatsApp store in 3 simple steps"
      steps={[
        {
          title: "Create your free account",
          description:
            "Sign up on Kredibly in under 60 seconds and claim your official storefront link.",
        },
        {
          title: "Upload your products",
          description:
            "Add product photos, Naira prices, sizes, and available quantities from your phone.",
        },
        {
          title: "Share on WhatsApp & get paid",
          description:
            "Post your link on WhatsApp Status or send it in DMs—buyers order and pay in seconds.",
        },
      ]}
      faqs={[
        {
          question: "Is Kredibly free for WhatsApp sellers in Nigeria?",
          answer:
            "Yes. Kredibly's Starter plan is ₦0/month for up to 10 products with a 2.5% transaction fee on checkout orders. Paid plans start at ₦5,000/month with 0% Kredibly commission.",
        },
        {
          question: "Do my customers need to download an app to buy from my WhatsApp store?",
          answer:
            "No. Your Kredibly store opens directly in any mobile browser when a customer taps your link on WhatsApp, Instagram, or TikTok.",
        },
        {
          question: "How do I receive payments from WhatsApp orders?",
          answer:
            "Payments are processed securely via Nomba (bank transfer and card), and your order status updates automatically in your Kredibly dashboard.",
        },
      ]}
    />
  );
}
