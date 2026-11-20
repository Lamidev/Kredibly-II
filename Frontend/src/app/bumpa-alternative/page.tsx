import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";

export const metadata: Metadata = {
  title: "Best Bumpa Alternative in Nigeria (2026) — Free Starter & 0% Pro Fees | Kredibly",
  description:
    "Looking for a fast, simple Bumpa alternative in Nigeria? Compare Kredibly's ₦0/mo free plan, transparent Naira pricing, and instant social-commerce checkout.",
  alternates: {
    canonical: "https://usekredibly.com/bumpa-alternative",
  },
  openGraph: {
    title: "Kredibly — A Simple, Fast Bumpa Alternative in Nigeria",
    description:
      "Start free with ₦0/month, launch in 2 minutes, and scale to 0% Kredibly commission on Starter Plus, Deluxe Pro, and Ultimate.",
    url: "https://usekredibly.com/bumpa-alternative",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Bumpa Alternative in Nigeria | Kredibly",
    description:
      "Compare Kredibly vs. Bumpa for Nigerian social media sellers: free starter plan, clean storefronts, and Nomba payments.",
  },
};

export default function BumpaAlternativePage() {
  return (
    <SeoLandingPage
      slug="/bumpa-alternative"
      eyebrow="Bumpa Alternative"
      title="A simpler, faster Bumpa alternative built for Nigerian social sellers"
      subtitle="If you want a clean online store you can launch in two minutes—without bloated setup or high upfront costs—Kredibly gives you a ₦0/month Starter plan and transparent Naira tiers as you grow."
      ctaLabel="Try Kredibly Free"
      highlightsTitle="Why Nigerian merchants switch to Kredibly"
      highlights={[
        {
          title: "Truly free Starter plan (₦0/month)",
          description:
            "List up to 20 products and start accepting real online orders immediately before paying any monthly subscription.",
        },
        {
          title: "Zero commission on all paid tiers",
          description:
            "Upgrade to Starter Plus (₦5,000/mo), Deluxe Pro (₦10,000/mo), or Ultimate (₦20,000/mo) and keep 100% of your sales with 0% Kredibly commission.",
        },
        {
          title: "Built for speed on mobile",
          description:
            "Your storefront is lightweight, SEO-ready, and designed to convert WhatsApp, Instagram, and TikTok shoppers smoothly.",
        },
      ]}
      comparisonTitle="Kredibly vs. Legacy Store Builders"
      comparisonSubtitle="Transparent Naira pricing and fast setup so you can focus on selling."
      otherColumnLabel="Traditional Store Apps"
      comparisonRows={[
        {
          feature: "Free Starter tier",
          kredibly: "₦0/month for up to 20 products (2.5% fee)",
          other: "Often limited trials or feature-locked",
        },
        {
          feature: "Paid Naira plans",
          kredibly: "₦5,000 / ₦10,000 / ₦20,000 per month",
          other: "Higher monthly commitments for full tools",
        },
        {
          feature: "Storefront setup time",
          kredibly: "Live in ~2 minutes from your phone",
          other: "Longer multi-step onboarding",
        },
        {
          feature: "Payment & payouts",
          kredibly: "Direct Naira checkout & payouts via Nomba",
          other: "Varies by integration",
        },
      ]}
      stepsTitle="Switch or launch on Kredibly in 3 steps"
      steps={[
        {
          title: "Open your free Kredibly store",
          description:
            "Register in under a minute—no credit card or monthly commitment required to start.",
        },
        {
          title: "Add your top-selling products",
          description:
            "Upload up to 20 products on the Starter plan with photos, prices, and variants.",
        },
        {
          title: "Share your new link everywhere",
          description:
            "Update your WhatsApp, Instagram, and TikTok bio links and start taking orders.",
        },
      ]}
      faqs={[
        {
          question: "How much are Kredibly's pricing plans in Naira?",
          answer:
            "Starter is ₦0/month (up to 20 products, 2.5% fee). Starter Plus is ₦5,000/month (50 products, 0% commission). Deluxe Pro is ₦10,000/month (200 products, 0% commission, custom domain). Ultimate Scale is ₦20,000/month (1,000+ products, 0% commission).",
        },
        {
          question: "Can I start free and upgrade only when my store grows?",
          answer:
            "Yes. Every merchant can start on the ₦0 Starter plan and upgrade to Starter Plus, Deluxe Pro, or Ultimate whenever they need more product slots or 0% commission.",
        },
        {
          question: "Does Kredibly also offer custom website builds?",
          answer:
            "Yes. If your brand needs a bespoke custom-designed e-commerce website, check out Kredibly Custom Builds at usekredibly.com/custom-builds.",
        },
      ]}
    />
  );
}
