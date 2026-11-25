import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";

export const metadata: Metadata = {
  title: "Best Catlog Alternative in Nigeria — Online Store Builder | Kredibly",
  description:
    "Compare Kredibly as a modern Catlog alternative for Nigerian WhatsApp and Instagram sellers. Free ₦0/mo plan, Nomba checkout, and 0% commission paid tiers.",
  alternates: {
    canonical: "https://usekredibly.com/catlog-alternative",
  },
  openGraph: {
    title: "Kredibly — A Fast Catlog Alternative for Nigerian Sellers",
    description:
      "Build a high-converting storefront in 2 minutes, share on WhatsApp & Instagram, and accept Naira payments via Nomba.",
    url: "https://usekredibly.com/catlog-alternative",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Catlog Alternative in Nigeria | Kredibly",
    description:
      "Launch an official online store in Nigeria with ₦0/month Starter pricing and 0% commission on paid plans.",
  },
};

export default function CatlogAlternativePage() {
  return (
    <SeoLandingPage
      slug="/catlog-alternative"
      eyebrow="Catlog Alternative"
      title="A modern Catlog alternative built to convert social shoppers"
      subtitle="Turn WhatsApp, Instagram, and TikTok traffic into completed Naira orders with a clean storefront, custom domain support on Pro+, and direct checkout powered by Nomba."
      ctaLabel="Launch Your Kredibly Store Free"
      highlightsTitle="What makes Kredibly stand out"
      highlights={[
        {
          title: "Clean, high-trust storefront UX",
          description:
            "Editorial-grade product pages that load fast on mobile and make first-time buyers confident to pay online.",
        },
        {
          title: "Flexible Naira plans up to 1,000+ products",
          description:
            "Start free at ₦0/month for 10 products, or scale to 50, 200, or 1,000+ products with 0% Kredibly commission.",
        },
        {
          title: "Built-in Nomba payment infrastructure",
          description:
            "Seamless bank transfer and card checkout with automatic order confirmation and merchant payout tracking.",
        },
      ]}
      comparisonTitle="Kredibly vs. Basic Link-in-Bio Catalogs"
      comparisonSubtitle="Go beyond a basic list of products with a full social-commerce storefront."
      otherColumnLabel="Basic Catalog Tools"
      comparisonRows={[
        {
          feature: "Free plan allowance",
          kredibly: "₦0/month • Up to 10 products",
          other: "Often restricted on product count or checkout",
        },
        {
          feature: "Pro & Scale commission",
          kredibly: "0% Kredibly commission from ₦5,000/mo",
          other: "Transaction markups can add up at scale",
        },
        {
          feature: "Custom domain support",
          kredibly: "Included on Deluxe Pro (₦10k) & Ultimate (₦20k)",
          other: "Subdomain-only on lower tiers",
        },
        {
          feature: "Bespoke agency option",
          kredibly: "Custom Website Builds available when needed",
          other: "Template-only",
        },
      ]}
      stepsTitle="Get your Kredibly storefront live today"
      steps={[
        {
          title: "Claim your store URL",
          description:
            "Sign up for free and set your brand name, logo, and storefront link.",
        },
        {
          title: "Add products & Naira pricing",
          description:
            "List your items with photos, descriptions, sizes, and stock quantities.",
        },
        {
          title: "Start accepting online orders",
          description:
            "Share your store on WhatsApp, Instagram, and TikTok and track every order in one place.",
        },
      ]}
      faqs={[
        {
          question: "Who is Kredibly built for?",
          answer:
            "Kredibly is built for Nigerian social-commerce merchants—fashion brands, beauty sellers, gadget stores, food vendors, and creators—selling on WhatsApp, Instagram, and TikTok.",
        },
        {
          question: "What happens if I outgrow 10 products on the free plan?",
          answer:
            "You can upgrade anytime to Starter Plus (50 products, ₦5,000/mo), Deluxe Pro (200 products, ₦10,000/mo), or Ultimate Scale (1,000+ products, ₦20,000/mo)—all with 0% Kredibly commission.",
        },
        {
          question: "Is Nomba checkout included automatically?",
          answer:
            "Yes. Nomba payment processing is built directly into Kredibly storefronts so buyers can pay by bank transfer or card without extra plugins.",
        },
      ]}
    />
  );
}
