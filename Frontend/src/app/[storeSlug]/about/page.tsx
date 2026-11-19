import { Metadata } from "next";
import { notFound } from "next/navigation";
import { AboutClient } from "./AboutClient";
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
    return { title: "About Not Found — Kredibly" };
  }

  const title = `About ${store.name} — Official Store`;
  const description =
    store.aboutText?.slice(0, 160) ||
    store.description ||
    `Learn more about ${store.name}, verified products, and direct ordering on Kredibly.`;
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
      canonical: `https://${params.storeSlug}.kredibly.shop/about`,
    },
    openGraph: {
      title,
      description,
      siteName: store.name,
      locale: "en_NG",
      type: "website",
      url: `https://${params.storeSlug}.kredibly.shop/about`,
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

export default async function StoreAboutPage({
  params,
}: {
  params: { storeSlug: string };
}) {
  const store = await getStore(params.storeSlug);
  if (!store) {
    notFound();
  }
  return <AboutClient store={store} />;
}
