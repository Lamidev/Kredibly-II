import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isStoreIndexable } from "@/lib/seo";
import { BLOG_POSTS } from "@/data/blogPosts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (headers().get("host") || "").split(":")[0].toLowerCase();
  const now = new Date();

  if (
    host.endsWith(".kredibly.shop") &&
    host !== "kredibly.shop" &&
    host !== "www.kredibly.shop"
  ) {
    const slug = host.replace(".kredibly.shop", "");
    try {
      const res = await fetch(`${API_URL}/public/stores/${slug}`, {
        cache: "no-store",
      });
      if (!res.ok) return [];
      const json = await res.json();
      const store = json.data;
      if (!isStoreIndexable(store)) return [];

      const storeBase = `https://${slug}.kredibly.shop`;
      const productEntries: MetadataRoute.Sitemap = (store.products || []).map(
        (product: { slug: string; updatedAt?: string }) => ({
          url: `${storeBase}/p/${product.slug}`,
          lastModified: product.updatedAt ? new Date(product.updatedAt) : now,
          changeFrequency: "weekly",
          priority: 0.8,
        })
      );

      return [
        {
          url: storeBase,
          lastModified: now,
          changeFrequency: "daily",
          priority: 1.0,
        },
        ...productEntries,
      ];
    } catch {
      return [];
    }
  }

  const baseUrl = "https://usekredibly.com";

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/custom-builds`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/whatsapp-store-builder`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/instagram-shop-builder`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/bumpa-alternative`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/catlog-alternative`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...BLOG_POSTS.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
