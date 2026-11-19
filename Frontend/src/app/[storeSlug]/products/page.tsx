import { Metadata } from "next";
import { notFound } from "next/navigation";
import { AllProductsClient } from "./AllProductsClient";
import { getImageUrl } from "@/lib/utils";

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
    return { title: "Products Not Found — Kredibly" };
  }
  const title = `All Products — ${store.name}`;
  const description =
    store.description || `Browse all products from ${store.name} on Kredibly.`;
  const ogImage = store.logoUrl
    ? getImageUrl(store.logoUrl)
    : "https://usekredibly.com/krediblyoriginal.jpeg";

  return {
    title,
    description,
    ...(store.logoUrl
      ? {
          icons: {
            icon: ogImage,
            apple: ogImage,
          },
        }
      : {}),
    alternates: {
      canonical: `https://${params.storeSlug}.kredibly.shop/products`,
    },
    openGraph: {
      title,
      description,
      siteName: store.name,
      locale: "en_NG",
      type: "website",
      url: `https://${params.storeSlug}.kredibly.shop/products`,
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

export default async function StoreAllProductsPage({
  params,
  searchParams,
}: {
  params: { storeSlug: string };
  searchParams?: { category?: string; q?: string };
}) {
  const store = await getStore(params.storeSlug);
  if (!store) {
    notFound();
  }

  return (
    <AllProductsClient
      store={store}
      initialCategory={searchParams?.category || "all"}
      initialQuery={searchParams?.q || ""}
    />
  );
}
