/**
 * Sanitizes a store name into a URL-friendly slug:
 * - Converts to lowercase
 * - Replaces spaces and underscores with hyphens
 * - Removes any non-alphanumeric characters except hyphens
 * - Strips leading and trailing hyphens
 */
export function sanitizeSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Validates whether a slug matches allowed URL criteria
 */
export function isValidSlug(slug: string): boolean {
  const regex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return regex.test(slug) && slug.length >= 3 && slug.length <= 40;
}

// Reserved slugs that cannot be claimed by merchants
export const RESERVED_SLUGS = new Set([
  "api",
  "admin",
  "dashboard",
  "login",
  "register",
  "checkout",
  "auth",
  "settings",
  "support",
  "terms",
  "privacy",
  "help",
  "orders",
  "wallet",
  "kredibly",
]);
