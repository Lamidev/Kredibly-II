import { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontClient } from "./StorefrontClient";

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
    `Browse authentic products from ${store.name}. Enjoy 100% Escrow Protection on Kredibly.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "Kredibly",
      locale: "en_NG",
      type: "website",
      images: store.logoUrl ? [{ url: store.logoUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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

  return <StorefrontClient store={store} />;
}
