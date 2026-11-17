import { prisma } from "../config/db";
import { AppError } from "../middleware/errorHandler";
import { sanitizeSlug } from "../utils/slug";
import {
  CreateProductInput,
  UpdateProductInput,
  UpdateStockInput,
} from "../validators/product.validator";

export class ProductService {
  /**
   * Create a new product for a store
   */
  static async createProduct(storeId: string, data: CreateProductInput) {
    // 1. Check Store product limit based on subscription tier
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { subscriptionTier: true },
    });

    if (!store) {
      throw new AppError("Store not found", 404);
    }

    const currentProductCount = await prisma.product.count({
      where: { storeId },
    });

    if (store.subscriptionTier === "STARTER" && currentProductCount >= 20) {
      throw new AppError(
        "Starter plan limit reached (max 20 products). Upgrade to Pro for up to 300 products.",
        403
      );
    }

    if (store.subscriptionTier === "PRO" && currentProductCount >= 300) {
      throw new AppError(
        "Pro plan limit reached (max 300 products). Upgrade to Business Scale for unlimited products.",
        403
      );
    }

    // 2. Generate slug unique to this store
    let productSlug = sanitizeSlug(data.title);
    if (!productSlug) {
      productSlug = `prod-${Date.now()}`;
    }

    const existingSlug = await prisma.product.findUnique({
      where: {
        storeId_slug: {
          storeId,
          slug: productSlug,
        },
      },
    });

    if (existingSlug) {
      productSlug = `${productSlug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    // 3. Create product with variants in transaction
    const product = await prisma.$transaction(async (tx) => {
      const newProd = await tx.product.create({
        data: {
          storeId,
          title: data.title.trim(),
          slug: productSlug,
          description: data.description?.trim(),
          category: data.category?.trim() || null,
          brand: data.brand?.trim() || null,
          basePrice: data.basePrice,
          comparePrice: data.comparePrice ?? null,
          images: data.images,
          stockQuantity: data.stockQuantity,
          isFeatured: data.isFeatured ?? false,
          hasVariants: data.hasVariants,
          isActive: true,
          variants:
            data.hasVariants && data.variants && data.variants.length > 0
              ? {
                  create: data.variants.map((v) => ({
                    name: v.name.trim(),
                    price: v.price,
                    stockQuantity: v.stockQuantity,
                    sku: v.sku?.trim(),
                  })),
                }
              : undefined,
        },
        include: {
          variants: true,
        },
      });

      return newProd;
    });

    return product;
  }

  /**
   * Get all products for a merchant's store
   */
  static async getMerchantProducts(storeId: string, query?: { search?: string; category?: string }) {
    const whereClause: any = { storeId };

    if (query?.search) {
      whereClause.OR = [
        { title: { contains: query.search.trim(), mode: "insensitive" } },
        { category: { contains: query.search.trim(), mode: "insensitive" } },
        { brand: { contains: query.search.trim(), mode: "insensitive" } },
      ];
    }

    if (query?.category && query.category !== "ALL") {
      whereClause.category = {
        equals: query.category.trim(),
        mode: "insensitive",
      };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        variants: true,
      },
      orderBy: [
        { isFeatured: "desc" },
        { createdAt: "desc" },
      ],
    });

    return products;
  }

  /**
   * Get single product by id for merchant
   */
  static async getProductById(storeId: string, productId: string) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId,
      },
      include: {
        variants: true,
      },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return product;
  }

  /**
   * Update product details
   */
  static async updateProduct(
    storeId: string,
    productId: string,
    data: UpdateProductInput
  ) {
    const existing = await prisma.product.findFirst({
      where: { id: productId, storeId },
    });

    if (!existing) {
      throw new AppError("Product not found", 404);
    }

    return await prisma.$transaction(async (tx) => {
      if (data.hasVariants !== undefined && data.variants) {
        await tx.productVariant.deleteMany({
          where: { productId },
        });

        if (data.hasVariants && data.variants.length > 0) {
          await tx.productVariant.createMany({
            data: data.variants.map((v) => ({
              productId,
              name: v.name.trim(),
              price: v.price,
              stockQuantity: v.stockQuantity,
              sku: v.sku?.trim(),
            })),
          });
        }
      }

      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          title: data.title?.trim(),
          description: data.description?.trim(),
          category: data.category !== undefined ? data.category?.trim() || null : undefined,
          brand: data.brand !== undefined ? data.brand?.trim() || null : undefined,
          basePrice: data.basePrice,
          comparePrice: data.comparePrice,
          images: data.images,
          stockQuantity: data.stockQuantity,
          isFeatured: data.isFeatured,
          hasVariants: data.hasVariants,
        },
        include: {
          variants: true,
        },
      });

      return updated;
    });
  }

  /**
   * Quick update stock, active, and featured toggles
   */
  static async updateStock(
    storeId: string,
    productId: string,
    data: UpdateStockInput
  ) {
    const existing = await prisma.product.findFirst({
      where: { id: productId, storeId },
    });

    if (!existing) {
      throw new AppError("Product not found", 404);
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        stockQuantity: data.stockQuantity,
        isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
        isFeatured: data.isFeatured !== undefined ? data.isFeatured : existing.isFeatured,
      },
    });

    return updated;
  }

  /**
   * Delete product
   */
  static async deleteProduct(storeId: string, productId: string) {
    const existing = await prisma.product.findFirst({
      where: { id: productId, storeId },
    });

    if (!existing) {
      throw new AppError("Product not found", 404);
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    return { message: "Product deleted successfully" };
  }
}
