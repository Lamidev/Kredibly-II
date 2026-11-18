import { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontClient } from "./StorefrontClient";
import { getImageUrl } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function getStore(storeSlug: string) {
  try {
    const res = await fetch(`${API_URL}/public/stores/${storeSlug}`, {
      next: { revalidate: 30 }, // ISR edge caching
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { storeSlug: string };
}): Promise<Metadata> {
  const store = await getStore(params.storeSlug);

  if (!store) {
    return {
      title: "Store Not Found — Kredibly",
      description: "The store you are looking for does not exist on Kredibly.",
    };
  }

  const title = `${store.name} — Shop on Kredibly`;
  const description =
    store.description ||
    `Browse authentic products from ${store.name}. Enjoy instant checkout and verified payments on Kredibly.`;
  const ogImage = store.logoUrl ? getImageUrl(store.logoUrl) : "";

  return {
    title,
    description,
    alternates: {
      canonical: `https://kredibly.shop/${params.storeSlug}`,
    },
    openGraph: {
      title,
      description,
      siteName: store.name,
      locale: "en_NG",
      type: "website",
      url: `https://kredibly.shop/${params.storeSlug}`,
      images: ogImage ? [{ url: ogImage }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function StorePage({
  params,
}: {
  params: { storeSlug: string };
}) {
  const store = await getStore(params.storeSlug);

  if (!store) {
    notFound();
  }

  const storeJsonLd = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: store.name,
    url: `https://kredibly.shop/${store.slug}`,
    description: store.description || `Official online store for ${store.name}`,
    image: store.logoUrl || undefined,
    currenciesAccepted: store.currency || "NGN",
    paymentAccepted: "Debit Card, Instant Bank Transfer",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
      />
      <StorefrontClient store={store} />
    </>
  );
}
