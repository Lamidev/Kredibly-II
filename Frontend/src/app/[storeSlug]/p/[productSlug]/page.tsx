import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "./ProductDetailClient";

export const dynamic = "force-dynamic";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function getProduct(storeSlug: string, productSlug: string) {
  try {
    const res = await fetch(
      `${API_URL}/public/stores/${storeSlug}/products/${productSlug}`,
      {
        cache: "no-store",
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
    `Order ${product.title} directly from ${store.name}. Instant checkout and fast delivery.`;

  const fallbackLogo = store.logoUrl
    ? store.logoUrl.startsWith("http")
      ? store.logoUrl
      : `${API_URL.replace("/api", "")}${store.logoUrl}`
    : undefined;

  const primaryImage = product.images?.[0]
    ? product.images[0].startsWith("http")
      ? product.images[0]
      : `${API_URL.replace("/api", "")}${product.images[0]}`
    : fallbackLogo;

  return {
    title,
    description,
    alternates: {
      canonical: `https://${params.storeSlug}.kredibly.shop/p/${params.productSlug}`,
    },
    openGraph: {
      title,
      description,
      siteName: store.name,
      locale: "en_NG",
      type: "website",
      url: `https://${params.storeSlug}.kredibly.shop/p/${params.productSlug}`,
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

export default async function ProductPage({
  params,
}: {
  params: { storeSlug: string; productSlug: string };
}) {
  const [data, fullStore] = await Promise.all([
    getProduct(params.storeSlug, params.productSlug),
    getStore(params.storeSlug),
  ]);

  if (!data || !data.product) {
    notFound();
  }

  const storeForClient = fullStore || data.store;

  const productUrl = `https://${data.store.slug}.kredibly.shop/p/${data.product.slug}`;
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
      <ProductDetailClient store={storeForClient} product={data.product} />
    </>
  );
}
