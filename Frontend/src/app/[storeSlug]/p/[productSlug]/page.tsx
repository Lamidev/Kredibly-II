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
    alternates: {
      canonical: `https://kredibly.shop/${params.storeSlug}/p/${params.productSlug}`,
    },
    openGraph: {
      title,
      description,
      siteName: store.name,
      locale: "en_NG",
      type: "website",
      url: `https://kredibly.shop/${params.storeSlug}/p/${params.productSlug}`,
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

  const productUrl = `https://kredibly.shop/${data.store.slug}/p/${data.product.slug}`;
  const images = (data.product.images || []).map((img: string) =>
    img.startsWith("http") ? img : `${API_URL.replace("/api", "")}${img}`
  );

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: data.product.title,
    description:
      data.product.description || `${data.product.title} from ${data.store.name}`,
    image: images,
    sku: data.product.id,
    brand: {
      "@type": "Brand",
      name: data.store.name,
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: data.store.currency || "NGN",
      price: data.product.basePrice,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      itemCondition: "https://schema.org/NewCondition",
      availability:
        data.product.stockQuantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: data.store.name,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductDetailClient store={data.store} product={data.product} />
    </>
  );
}
