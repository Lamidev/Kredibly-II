import { z } from "zod";

export const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Variant name is required"), // e.g. "Size: 42, Color: Black"
  price: z.coerce.number().min(50, "Variant price must be at least ₦50"),
  stockQuantity: z.coerce.number().int().min(0, "Stock cannot be negative"),
  sku: z.string().optional(),
});

export const createProductSchema = z.object({
  title: z.string().min(2, "Product title must be at least 2 characters").max(150),
  description: z.string().optional(),
  category: z.string().max(60).optional().nullable(),
  brand: z.string().max(60).optional().nullable(),
  basePrice: z.coerce.number().min(100, "Base price must be at least ₦100"),
  comparePrice: z.coerce.number().optional().nullable(),
  images: z.array(z.string()).max(2, "Maximum 2 images allowed per product"),
  stockQuantity: z.coerce.number().int().min(0).default(1),
  isFeatured: z.boolean().default(false),
  hasVariants: z.boolean().default(false),
  variants: z.array(variantSchema).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const updateStockSchema = z.object({
  stockQuantity: z.coerce.number().int().min(0),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type UpdateStockInput = z.infer<typeof updateStockSchema>;
