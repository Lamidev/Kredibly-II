import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://usekredibly.com"),
  title: "Kredibly — Build Your Official Online Store in 2 Minutes",
  description:
    "The storefront builder for Instagram, TikTok, and WhatsApp sellers. Showcase products, accept card & bank transfer payments with built-in buyer trust, and get paid directly to your bank account.",
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
      "Create your online store, accept verified payments, and sell without friction.",
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
