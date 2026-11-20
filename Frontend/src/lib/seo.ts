export interface StoreSeoInput {
  name: string;
  slug?: string;
  description?: string | null;
  aboutText?: string | null;
  address?: string | null;
  socialLinks?: {
    instagram?: string | null;
    tiktok?: string | null;
    facebook?: string | null;
    twitter?: string | null;
  } | null;
  logoUrl?: string | null;
  isActive?: boolean;
  allowSearchIndexing?: boolean;
  isSearchIndexable?: boolean;
  products?: Array<{ title?: string; isActive?: boolean }>;
}

/**
 * Builds the Google/social title for a merchant storefront.
 */
export function buildStoreMetaTitle(storeName: string): string {
  return `${storeName} — Official Online Store | Powered by Kredibly`;
}

/**
 * Builds a clean storefront meta description from the merchant's bio,
 * about text, or top active products without repeating Kredibly branding.
 */
export function buildStoreMetaDescription(store: StoreSeoInput): string {
  const shortDesc = store.description?.trim();
  if (shortDesc) {
    return shortDesc.length > 160 ? `${shortDesc.slice(0, 157)}...` : shortDesc;
  }

  const about = store.aboutText?.trim();
  if (about) {
    return about.length > 160 ? `${about.slice(0, 157)}...` : about;
  }

  const topTitles = (store.products || [])
    .map((p) => p.title?.trim())
    .filter((t): t is string => Boolean(t))
    .slice(0, 3);

  if (topTitles.length > 0) {
    return `Shop ${topTitles.join(", ")} directly from ${store.name}. Instant checkout and fast delivery.`;
  }

  return `Browse authentic products directly from ${store.name}. Instant checkout and fast delivery.`;
}

/**
 * Determines whether a merchant storefront meets quality & privacy rules
 * to be indexed by Google and AI search engines.
 */
export function isStoreIndexable(store: StoreSeoInput | null | undefined): boolean {
  if (!store) return false;
  if (typeof store.isSearchIndexable === "boolean") {
    return store.isSearchIndexable;
  }

  const hasBio = Boolean(store.description?.trim() || store.aboutText?.trim());
  const hasAddress = Boolean(store.address?.trim());
  const hasSocial = Boolean(
    store.socialLinks &&
      ["instagram", "tiktok", "facebook", "twitter"].some((k) => {
        const val = store.socialLinks?.[k as keyof typeof store.socialLinks];
        return typeof val === "string" && val.trim().length > 0;
      })
  );
  const productCount = store.products?.length ?? 0;

  return Boolean(
    store.isActive !== false &&
      store.allowSearchIndexing !== false &&
      store.logoUrl &&
      hasBio &&
      hasAddress &&
      hasSocial &&
      productCount >= 3
  );
}
