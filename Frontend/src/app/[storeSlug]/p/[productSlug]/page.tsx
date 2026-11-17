import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "./ProductDetailClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function getProduct(storeSlug: string, productSlug: string) {
  try {
    const res = await fetch(
      `${API_URL}/public/stores/${storeSlug}/products/${productSlug}`,
      {
        next: { revalidate: 30 }, // ISR edge caching
      }
    );

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
  params: { storeSlug: string; productSlug: string };
}): Promise<Metadata> {
  const data = await getProduct(params.storeSlug, params.productSlug);

  if (!data || !data.product) {
    return {
      title: "Product Not Found — Kredibly",
    };
  }

  const { store, product } = data;
  const formattedPrice = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(product.basePrice));

  const title = `${product.title} (${formattedPrice}) — ${store.name}`;
  const description =
    product.description ||
    `Order ${product.title} directly from ${store.name}. Fast delivery with 100% Kredibly Escrow Guarantee.`;

  const primaryImage = product.images?.[0]
    ? product.images[0].startsWith("http")
      ? product.images[0]
      : `${API_URL.replace("/api", "")}${product.images[0]}`
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "Kredibly",
      locale: "en_NG",
      type: "website",
      images: primaryImage ? [{ url: primaryImage }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: primaryImage ? [primaryImage] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: { storeSlug: string; productSlug: string };
}) {
  const data = await getProduct(params.storeSlug, params.productSlug);

  if (!data || !data.product) {
    notFound();
  }

  return (
    <ProductDetailClient store={data.store} product={data.product} />
  );
}
