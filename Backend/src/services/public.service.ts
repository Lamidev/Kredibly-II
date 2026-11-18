import { prisma } from "../config/db";
import { AppError } from "../middleware/errorHandler";

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
        passFeeToCustomer: true,
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

    return {
      ...store,
      verifiedOrdersCount: store._count.orders,
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
        logoUrl: true,
        whatsappNumber: true,
        currency: true,
        passFeeToCustomer: true,
      },
    });

    if (!store) {
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

    return {
      store,
      product,
    };
  }

  /**
   * Phone-First Order Lookup for Shoppers ("Track My Order" without passwords)
   */
  static async trackOrders(storeSlug: string, query: string) {
    const cleanSlug = storeSlug.toLowerCase().trim();
    const cleanQuery = query.trim();

    if (!cleanQuery || cleanQuery.length < 4) {
      throw new AppError("Please enter your phone number or order number (e.g. KRD-1234)", 400);
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
        OR: [
          { orderNumber: { equals: cleanQuery, mode: "insensitive" } },
          { customer: { phoneNumber: { contains: cleanQuery } } },
        ],
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
