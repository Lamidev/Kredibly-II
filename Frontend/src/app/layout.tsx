import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://usekredibly.com"),
  alternates: {
    canonical: "https://usekredibly.com",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kredibly",
  },
  title: "Kredibly — Build Your Official Online Store in 2 Minutes",
  description:
    "The simple online store builder for social media sellers in Nigeria. Add your goods, share your link on WhatsApp, Instagram, or TikTok, and let customers place orders and pay online.",
  keywords: [
    "online store builder Nigeria",
    "sell on WhatsApp",
    "sell on Instagram Nigeria",
    "e-commerce storefront",
    "social commerce Nigeria",
    "bio link shop",
    "Bumpa alternative",
    "Catlog alternative",
    "create free online store",
    "Kredibly",
  ],
  verification: {
    google: "google4d682cf168a8ae73",
    other: {
      "facebook-domain-verification": "2s0jt80h2mu4iv9nt4dbvkriibdva2",
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Kredibly — The E-Commerce Storefront Builder",
    description:
      "Turn your social media into your online shop. Add products, accept payments online, and sell without friction.",
    url: "https://usekredibly.com",
    siteName: "Kredibly",
    images: [
      {
        url: "/krediblyoriginal.jpeg",
        width: 1200,
        height: 630,
        alt: "Kredibly Platform",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kredibly — Turn your social media into your online shop",
    description:
      "Create your free online store in 2 minutes. Add products and start selling on WhatsApp and Instagram.",
    images: ["/krediblyoriginal.jpeg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Kredibly",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, iOS, Android",
      url: "https://usekredibly.com",
      description:
        "The simple online store builder for social media sellers in Nigeria. Add products, share your store link on WhatsApp and Instagram, and accept direct payments.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "NGN",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Kredibly",
      legalName: "Akinbyte Technologies Limited",
      url: "https://usekredibly.com",
      email: "support@usekredibly.com",
      areaServed: {
        "@type": "Country",
        name: "Nigeria",
      },
    },
  ];

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased selection:bg-brand-500 selection:text-white">
        <GoogleAnalytics />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
