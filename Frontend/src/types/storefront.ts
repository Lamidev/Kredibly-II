export interface ProductVariant {
  id: string;
  name: string;
  price: number | string;
  stockQuantity: number;
}

export interface ProductAttribute {
  label: string;
  value: string;
}

export interface StoreProduct {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  brand?: string | null;
  attributes?: ProductAttribute[] | null;
  isFeatured?: boolean;
  basePrice: number | string;
  comparePrice?: number | string | null;
  images: string[];
  stockQuantity: number;
  hasVariants: boolean;
  variants: ProductVariant[];
}

export interface SocialLinks {
  instagram?: string | null;
  tiktok?: string | null;
  facebook?: string | null;
  twitter?: string | null;
}

export interface ShippingConfig {
  defaultFee: number;
  freeDeliveryEnabled: boolean;
  freeDeliveryScope: "ALL" | "SELECTED";
  freeDeliveryStates: string[];
  freeDeliveryMinOrder?: number | null;
  stateRates: Record<string, number>;
  offerBannerEnabled?: boolean;
  offerBannerText?: string | null;
  offerBannerExpiresAt?: string | null;
}

export interface StoreData {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  themeColor?: string;
  whatsappNumber: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  address?: string | null;
  socialLinks?: SocialLinks | null;
  shippingConfig?: ShippingConfig | null;
  currency: string;
  verifiedOrdersCount?: number;
  products?: StoreProduct[];
}

export function calculateClientShippingFee(
  cfg: ShippingConfig | null | undefined,
  state: string,
  subtotal: number
): number {
  if (!cfg) return 0;
  const cleanState = (state || "").trim().toLowerCase();

  if (cfg.freeDeliveryEnabled) {
    const minOrder = Number(cfg.freeDeliveryMinOrder || 0);
    const meetsMinOrder = minOrder <= 0 || subtotal >= minOrder;
    if (meetsMinOrder) {
      if (cfg.freeDeliveryScope === "ALL") return 0;
      if (
        cfg.freeDeliveryScope === "SELECTED" &&
        Array.isArray(cfg.freeDeliveryStates) &&
        cfg.freeDeliveryStates.some((s) => s.trim().toLowerCase() === cleanState)
      ) {
        return 0;
      }
    }
  }

  if (cfg.stateRates) {
    for (const [k, v] of Object.entries(cfg.stateRates)) {
      if (k.trim().toLowerCase() === cleanState) {
        const fee = Number(v);
        if (!Number.isNaN(fee) && fee >= 0) return fee;
      }
    }
  }

  const fallback = Number(cfg.defaultFee || 0);
  return !Number.isNaN(fallback) && fallback >= 0 ? fallback : 0;
}

export function getFreeDeliveryBannerText(
  cfg: ShippingConfig | null | undefined
): string | null {
  if (!cfg || !cfg.freeDeliveryEnabled) return null;
  const minOrder = Number(cfg.freeDeliveryMinOrder || 0);
  const minSuffix =
    minOrder > 0 ? ` on orders above ₦${minOrder.toLocaleString("en-NG")}` : "";

  if (cfg.freeDeliveryScope === "ALL") {
    return `Free nationwide delivery${minSuffix || " on all orders"}`;
  }

  const states = cfg.freeDeliveryStates || [];
  if (states.length === 0) return null;
  if (states.length <= 3) {
    return `Free delivery to ${states.join(", ")}${minSuffix}`;
  }
  return `Free delivery to ${states.slice(0, 2).join(", ")} + ${
    states.length - 2
  } more states${minSuffix}`;
}

export function getStorefrontBannerText(
  cfg: ShippingConfig | null | undefined
): string | null {
  if (cfg?.offerBannerEnabled && cfg.offerBannerText?.trim()) {
    if (cfg.offerBannerExpiresAt) {
      const expiresEnd = new Date(`${cfg.offerBannerExpiresAt}T23:59:59`);
      if (!Number.isNaN(expiresEnd.getTime()) && expiresEnd < new Date()) {
        return getFreeDeliveryBannerText(cfg);
      }
    }
    return cfg.offerBannerText.trim();
  }
  return getFreeDeliveryBannerText(cfg);
}

export function toSocialUrl(
  platform: keyof SocialLinks,
  raw?: string | null
): string | null {
  const val = raw?.trim();
  if (!val) return null;
  if (/^https?:\/\//i.test(val)) return val;
  const handle = val.replace(/^@/, "");
  const bases: Record<keyof SocialLinks, string> = {
    instagram: `https://instagram.com/${handle}`,
    tiktok: `https://tiktok.com/@${handle}`,
    facebook: `https://facebook.com/${handle}`,
    twitter: `https://x.com/${handle}`,
  };
  return bases[platform];
}

export function extractStoreCategories(products: StoreProduct[] = []) {
  const map = new Map<string, { label: string; count: number }>();
  products.forEach((p) => {
    if (p.category && p.category.trim()) {
      const key = p.category.trim().toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, { label: p.category.trim(), count: 1 });
      }
    }
  });
  return Array.from(map.entries()).map(([key, { label, count }]) => ({
    key,
    label,
    count,
  }));
}
