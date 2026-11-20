import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Reserved paths on the main platform
const RESERVED_PATHS = new Set([
  "",
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/dashboard",
  "/admin",
  "/api",
  "/blog",
  "/whatsapp-store-builder",
  "/instagram-shop-builder",
  "/bumpa-alternative",
  "/catlog-alternative",
  "/custom-builds",
  "/terms",
  "/privacy",
  "/refund-policy",
  "/policies",
  "/pricing",
  "/about",
  "/waitlist",
  "/invoice",
  "/solution",
  "/product",
  "/auth",
  "/favicon.ico",
  "/krediblyrevamped.png",
  "/kredibly-k-icon.png",
]);

const LEGACY_URL_REDIRECTS: Record<string, string> = {
  "/pricing": "/#pricing",
  "/about": "/",
  "/waitlist": "/register",
  "/invoice": "/",
  "/solution": "/#features",
  "/product": "/#features",
  "/auth": "/login",
};

const PLATFORM_REDIRECT_PREFIXES = [
  "/dashboard",
  "/admin",
  "/login",
  "/register",
  "/blog",
  "/whatsapp-store-builder",
  "/instagram-shop-builder",
  "/bumpa-alternative",
  "/catlog-alternative",
  "/custom-builds",
];

export function middleware(request: NextRequest) {
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  const { pathname, search } = request.nextUrl;

  // Allow static files, Next.js internal chunks, and images to pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isSubdomainStore =
    host.endsWith(".kredibly.shop") &&
    host !== "kredibly.shop" &&
    host !== "www.kredibly.shop";

  // 1. Subdomain Storefront: <slug>.kredibly.shop -> internally rewrite to /<slug>...
  if (isSubdomainStore) {
    const slug = host.slice(0, -".kredibly.shop".length);

    // Keep merchant dashboard, auth, blog & marketing pages on usekredibly.com
    if (PLATFORM_REDIRECT_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.redirect(
        new URL(`https://usekredibly.com${pathname}${search}`, request.url)
      );
    }

    if (slug === "blog") {
      const targetPath = pathname === "/" ? "/blog" : `/blog${pathname}`;
      return NextResponse.redirect(
        new URL(`https://usekredibly.com${targetPath}${search}`, request.url)
      );
    }

    // Normalize any accidental /<slug>/... path on the subdomain back to /...
    if (pathname === `/${slug}` || pathname.startsWith(`/${slug}/`)) {
      const stripped = pathname.slice(slug.length + 1) || "/";
      return NextResponse.redirect(
        new URL(`https://${host}${stripped}${search}`, request.url)
      );
    }

    const rewriteTarget =
      pathname === "/" ? `/${slug}` : `/${slug}${pathname}`;
    return NextResponse.rewrite(
      new URL(`${rewriteTarget}${search}`, request.url)
    );
  }

  const isKrediblyApex =
    host === "kredibly.shop" || host === "www.kredibly.shop";

  // 2. Apex kredibly.shop
  if (isKrediblyApex) {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("https://usekredibly.com", request.url));
    }

    if (PLATFORM_REDIRECT_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.redirect(
        new URL(`https://usekredibly.com${pathname}${search}`, request.url)
      );
    }

    // Redirect legacy kredibly.shop/<slug>/... -> <slug>.kredibly.shop/...
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length > 0 && !RESERVED_PATHS.has(`/${parts[0]}`)) {
      const slug = parts[0];
      const rest = parts.length > 1 ? `/${parts.slice(1).join("/")}` : "/";
      return NextResponse.redirect(
        new URL(`https://${slug}.kredibly.shop${rest}${search}`, request.url)
      );
    }
  }

  // 3. usekredibly.com/<slug> -> <slug>.kredibly.shop (or 301 legacy redirects)
  const isUseKredibly =
    host === "usekredibly.com" || host === "www.usekredibly.com";
  const firstSegment = "/" + (pathname.split("/")[1] || "");

  if (isUseKredibly) {
    const legacyTarget = LEGACY_URL_REDIRECTS[firstSegment];
    if (legacyTarget) {
      return NextResponse.redirect(
        new URL(`https://usekredibly.com${legacyTarget}${search}`, request.url),
        301 // Permanent Redirect (SEO 301): consolidates link equity & permanently drops stale URLs from Google
      );
    }
  }

  if (
    isUseKredibly &&
    !RESERVED_PATHS.has(firstSegment) &&
    !firstSegment.startsWith("/dashboard") &&
    !firstSegment.startsWith("/admin")
  ) {
    const parts = pathname.split("/").filter(Boolean);
    const slug = parts[0];
    const rest = parts.length > 1 ? `/${parts.slice(1).join("/")}` : "/";
    return NextResponse.redirect(
      new URL(`https://${slug}.kredibly.shop${rest}${search}`, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images / public assets with file extensions
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
