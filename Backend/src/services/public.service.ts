import { prisma } from "../config/db";
import { AppError } from "../middleware/errorHandler";

function hasAtLeastOneSocialLink(socialLinks: unknown): boolean {
  if (!socialLinks || typeof socialLinks !== "object") return false;
  const links = socialLinks as Record<string, unknown>;
  return ["instagram", "tiktok", "facebook", "twitter"].some(
    (key) => typeof links[key] === "string" && links[key].trim().length > 0
  );
}

export class PublicStoreService {
  /**
   * Get public store profile, KredScore metrics, and active products by slug
   */
  static async getStoreBySlug(slug: string) {
    const cleanSlug = slug.toLowerCase().trim();

    const store = await prisma.store.findUnique({
      where: { slug: cleanSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        aboutText: true,
        logoUrl: true,
        bannerUrl: true,
        themeColor: true,
        whatsappNumber: true,
        contactPhone: true,
        contactEmail: true,
        address: true,
        socialLinks: true,
        currency: true,
        subscriptionTier: true,
        isActive: true,
        allowSearchIndexing: true,
        passFeeToCustomer: true,
        shippingConfig: true,
        products: {
          where: { isActive: true },
          include: {
            variants: true,
          },
          orderBy: [
            { isFeatured: "desc" },
            { createdAt: "desc" },
          ],
        },
        _count: {
          select: {
            orders: {
              where: { paymentStatus: "PAID" },
            },
          },
        },
      },
    });

    if (!store) {
      throw new AppError(`Store '${slug}' not found`, 404);
    }

    const hasBio = Boolean(store.description?.trim() || store.aboutText?.trim());
    const hasAddress = Boolean(store.address?.trim());
    const hasSocial = hasAtLeastOneSocialLink(store.socialLinks);
    const isSearchIndexable = Boolean(
      store.isActive &&
        store.allowSearchIndexing &&
        store.logoUrl &&
        hasBio &&
        hasAddress &&
        hasSocial &&
        store.products.length >= 3
    );

    return {
      ...store,
      verifiedOrdersCount: store._count.orders,
      isSearchIndexable,
    };
  }

  /**
   * Get single public product by store slug and product slug
   */
  static async getProductBySlug(storeSlug: string, productSlug: string) {
    const cleanStoreSlug = storeSlug.toLowerCase().trim();
    const cleanProductSlug = productSlug.toLowerCase().trim();

    const store = await prisma.store.findUnique({
      where: { slug: cleanStoreSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        aboutText: true,
        address: true,
        socialLinks: true,
        logoUrl: true,
        whatsappNumber: true,
        currency: true,
        isActive: true,
        allowSearchIndexing: true,
        passFeeToCustomer: true,
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!store || !store.isActive) {
      throw new AppError(`Store '${storeSlug}' not found`, 404);
    }

    const product = await prisma.product.findFirst({
      where: {
        storeId: store.id,
        slug: cleanProductSlug,
        isActive: true,
      },
      include: {
        variants: true,
      },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const hasBio = Boolean(store.description?.trim() || store.aboutText?.trim());
    const hasAddress = Boolean(store.address?.trim());
    const hasSocial = hasAtLeastOneSocialLink(store.socialLinks);
    const isSearchIndexable = Boolean(
      store.isActive &&
        store.allowSearchIndexing &&
        store.logoUrl &&
        hasBio &&
        hasAddress &&
        hasSocial &&
        store._count.products >= 3
    );

    return {
      store: {
        ...store,
        isSearchIndexable,
      },
      product,
    };
  }

  /**
   * Order-Number-Only Lookup for Shoppers ("Track My Order" for a specific order)
   */
  static async trackOrders(storeSlug: string, query: string) {
    const cleanSlug = storeSlug.toLowerCase().trim();
    const raw = query.trim().replace(/^#/, "");
    const normalizedOrderNum = /^krd-/i.test(raw)
      ? raw.toUpperCase()
      : /^\d{4,10}$/.test(raw)
      ? `KRD-${raw}`
      : "";

    if (!normalizedOrderNum) {
      throw new AppError(
        "Enter a valid order number (e.g. KRD-9384207)",
        400
      );
    }

    const store = await prisma.store.findUnique({
      where: { slug: cleanSlug },
      select: { id: true, name: true, slug: true, whatsappNumber: true },
    });

    if (!store) {
      throw new AppError("Store not found", 404);
    }

    const orders = await prisma.order.findMany({
      where: {
        storeId: store.id,
        paymentStatus: "PAID",
        orderNumber: { equals: normalizedOrderNum, mode: "insensitive" },
      },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        orderStatus: true,
        paymentStatus: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            productTitle: true,
            variantName: true,
            quantity: true,
            unitPrice: true,
            product: {
              select: {
                images: true,
                slug: true,
              },
            },
          },
        },
        customer: {
          select: {
            fullName: true,
            state: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return {
      store,
      orders,
    };
  }
}
