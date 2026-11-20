import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export default function robots(): MetadataRoute.Robots {
  const host = (headers().get("host") || "").split(":")[0].toLowerCase();
  const isStoreSubdomain =
    host.endsWith(".kredibly.shop") && host !== "kredibly.shop" && host !== "www.kredibly.shop";

  const sitemapUrl = isStoreSubdomain
    ? `https://${host}/sitemap.xml`
    : "https://usekredibly.com/sitemap.xml";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/dashboard/",
          "/api/",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: sitemapUrl,
  };
}
