import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency = "NGN"): string {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  const safeAmount = Number.isFinite(numericAmount) ? numericAmount : 0;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(safeAmount);
}

/** Format a numeric string or number with comma thousand separators for inputs (e.g. "15000" -> "15,000"). */
export function formatNumberInput(value: string | number): string {
  if (value === "" || value === null || value === undefined) return "";
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-NG");
}

/** Parse a comma-formatted numeric string back to a number (e.g. "15,000" -> 15000). */
export function parseNumberInput(value: string): number {
  const digits = String(value).replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

export function getImageUrl(path?: string | null): string {
  if (!path) return "";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:") ||
    path.startsWith("data:")
  ) {
    return path;
  }
  const rawApi = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const base = rawApi.replace(/\/api\/?$/, "").replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export function getStoreUrl(slug: string): string {
  return `https://${slug}.kredibly.shop`;
}

export function getStorePath(slug: string, subPath = ""): string {
  const normalizedSub = subPath
    ? subPath.startsWith("/")
      ? subPath
      : `/${subPath}`
    : "";
  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    if (
      host.endsWith(".kredibly.shop") &&
      host !== "kredibly.shop" &&
      host !== "www.kredibly.shop"
    ) {
      return normalizedSub || "/";
    }
  }
  return `/${slug}${normalizedSub}`;
}
