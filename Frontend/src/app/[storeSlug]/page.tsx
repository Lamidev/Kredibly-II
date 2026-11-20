import { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontClient } from "./StorefrontClient";
import { getImageUrl } from "@/lib/utils";
import {
  buildStoreMetaDescription,
  buildStoreMetaTitle,
  isStoreIndexable,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function getStore(storeSlug: string) {
  try {
    const res = await fetch(`${API_URL}/public/stores/${storeSlug}`, {
      cache: "no-store",
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
      robots: { index: false, follow: false },
    };
  }

  const title = buildStoreMetaTitle(store.name);
  const description = buildStoreMetaDescription(store);
  const indexable = isStoreIndexable(store);
  const ogImage = store.logoUrl
    ? getImageUrl(store.logoUrl)
    : "https://usekredibly.com/krediblyoriginal.jpeg";

  return {
    title,
    description,
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: false },
    ...(store.logoUrl
      ? {
          icons: {
            icon: ogImage,
            apple: ogImage,
          },
        }
      : {}),
    alternates: {
      canonical: `https://${params.storeSlug}.kredibly.shop`,
    },
    openGraph: {
      title,
      description,
      siteName: store.name,
      locale: "en_NG",
      type: "website",
      url: `https://${params.storeSlug}.kredibly.shop`,
      images: [
        {
          url: ogImage,
          width: 600,
          height: 600,
          alt: `${store.name} logo`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
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
    url: `https://${store.slug}.kredibly.shop`,
    description: buildStoreMetaDescription(store),
    image: store.logoUrl ? getImageUrl(store.logoUrl) : undefined,
    currenciesAccepted: store.currency || "NGN",
    paymentAccepted: "Debit Card, Instant Bank Transfer",
    brand: {
      "@type": "Organization",
      name: "Kredibly",
      url: "https://usekredibly.com",
    },
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
