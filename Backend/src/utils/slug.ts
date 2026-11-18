/**
 * Sanitizes a store name into a clean, hyphen-free subdomain slug:
 * - Converts to lowercase
 * - Removes all spaces, hyphens, underscores, and non-alphanumeric characters
 */
export function sanitizeSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");
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
