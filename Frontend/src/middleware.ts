import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Reserved paths on the main platform
const RESERVED_PATHS = new Set([
  "",
  "/",
  "/login",
  "/register",
  "/dashboard",
  "/api",
  "/terms",
  "/privacy",
  "/refund-policy",
  "/policies",
  "/favicon.ico",
  "/krediblyrevamped.png",
  "/kredibly-k-icon.png",
]);

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase() || "";
  const { pathname } = request.nextUrl;

  // Allow static files, Next.js internal chunks, and images to pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isKrediblyShop = host.includes("kredibly.shop");

  // 1. Root of kredibly.shop -> Redirect curious visitors to main marketing platform
  if (isKrediblyShop && pathname === "/") {
    return NextResponse.redirect(new URL("https://usekredibly.com", request.url));
  }

  // 2. Prevent dashboard or auth access directly under kredibly.shop (keep merchant operations on usekredibly.com)
  if (
    isKrediblyShop &&
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/register"))
  ) {
    return NextResponse.redirect(
      new URL(`https://usekredibly.com${pathname}`, request.url)
    );
  }

  // 3. Optional: If someone visits a store on usekredibly.com/urbanwears instead of kredibly.shop/urbanwears,
  // redirect them to the official storefront domain
  const isUseKredibly = host.includes("usekredibly.com");
  const firstSegment = "/" + pathname.split("/")[1];

  if (isUseKredibly && !RESERVED_PATHS.has(firstSegment) && !firstSegment.startsWith("/dashboard")) {
    return NextResponse.redirect(
      new URL(`https://kredibly.shop${pathname}`, request.url)
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
