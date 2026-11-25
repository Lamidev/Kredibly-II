import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";

export const metadata: Metadata = {
  title: "Instagram Shop Builder in Nigeria — Bio Link Storefront | Kredibly",
  description:
    "Turn your Instagram followers into paying customers. Create a mobile-first Instagram shop in Nigeria with Kredibly, add it to your bio, and accept Naira payments.",
  alternates: {
    canonical: "https://usekredibly.com/instagram-shop-builder",
  },
  openGraph: {
    title: "Instagram Shop Builder in Nigeria | Kredibly",
    description:
      "Give every Instagram visitor a real storefront in your bio. Browse products, choose variants, and pay online without waiting for DM replies.",
    url: "https://usekredibly.com/instagram-shop-builder",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Instagram Shop Builder in Nigeria | Kredibly",
    description:
      "Convert Instagram Reels and Story views into instant checkout orders in Naira.",
  },
};

export default function InstagramShopBuilderPage() {
  return (
    <SeoLandingPage
      slug="/instagram-shop-builder"
      eyebrow="Instagram Shop Builder"
      title="Turn your Instagram bio link into a 24/7 storefront"
      subtitle="Don't lose impulse buyers while you're asleep or offline. Give your Instagram followers a branded store where they can browse collections, pick sizes, and check out anytime."
      ctaLabel="Build Your Instagram Shop Free"
      highlightsTitle="Why Instagram brands choose Kredibly"
      highlights={[
        {
          title: "Rich link previews on Instagram & chat",
          description:
            "Your store logo, brand name, and product details show cleanly whenever your link is shared in DMs or Story stickers.",
        },
        {
          title: "Mobile-first storefront design",
          description:
            "Built to load fast on Nigerian mobile networks so visitors from Reels and Stories never bounce before checking out.",
        },
        {
          title: "0% commission on paid plans",
          description:
            "Start free on Starter (₦0/mo) and upgrade to Starter Plus (₦5,000/mo), Deluxe Pro (₦10,000/mo), or Ultimate (₦20,000/mo) with 0% Kredibly commission.",
        },
      ]}
      comparisonTitle="Kredibly vs. 'DM to Order' on Instagram"
      comparisonSubtitle="Make it effortless for buyers who discover you from Reels, Stories, or Explore."
      otherColumnLabel="DM-Only Instagram Page"
      comparisonRows={[
        {
          feature: "24/7 self-service checkout",
          kredibly: "Buyers browse & pay even while you sleep",
          other: "Buyers wait hours for a DM reply and lose interest",
        },
        {
          feature: "Product variants & stock",
          kredibly: "Automatic stock count & size/color options",
          other: "Manual stock checks and sold-out apologies",
        },
        {
          feature: "Brand credibility",
          kredibly: "Official storefront URL + custom domain on Pro+",
          other: "Looks informal to first-time buyers",
        },
        {
          feature: "Order management",
          kredibly: "Centralized dashboard & instant receipts",
          other: "Buried in Instagram message requests",
        },
      ]}
      stepsTitle="Go from Instagram page to live shop in 2 minutes"
      steps={[
        {
          title: "Sign up & upload your brand logo",
          description:
            "Create your Kredibly account and customize your store name, logo, and bio.",
        },
        {
          title: "Add your catalog in Naira",
          description:
            "Upload crisp photos, prices, and variants for up to 10 products free (or 1,000+ on Ultimate).",
        },
        {
          title: "Drop the link in your IG bio & Stories",
          description:
            "Pin your store link in your bio and Story stickers so followers can shop immediately.",
        },
      ]}
      faqs={[
        {
          question: "Can I use my own custom domain for my Instagram shop?",
          answer:
            "Yes. Custom domain support is included on Kredibly's Deluxe (Pro) plan at ₦10,000/month and Ultimate (Scale) plan at ₦20,000/month.",
        },
        {
          question: "Can I link the same Kredibly store on TikTok and WhatsApp too?",
          answer:
            "Yes. One Kredibly storefront works across Instagram, WhatsApp, TikTok, and X so all your orders land in one dashboard.",
        },
        {
          question: "How much does it cost to start?",
          answer:
            "You can launch completely free on the Starter plan (₦0/month, up to 10 products, 2.5% transaction fee).",
        },
      ]}
    />
  );
}
