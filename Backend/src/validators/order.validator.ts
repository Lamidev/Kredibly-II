import { z } from "zod";

export const checkoutItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().optional().nullable(),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
});

export const initializeCheckoutSchema = z.object({
  storeSlug: z.string().min(1, "Store slug is required"),
  customer: z.object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    phoneNumber: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .max(15, "Phone number is too long"),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    address: z.string().min(5, "Delivery address must be at least 5 characters"),
    state: z.string().min(2, "State is required"),
    city: z.string().optional(),
  }),
  items: z.array(checkoutItemSchema).min(1, "At least one item is required in cart"),
  notes: z.string().optional(),
  paymentMethod: z.enum(["BANK_TRANSFER", "CARD"]).default("BANK_TRANSFER"),
});

export type InitializeCheckoutInput = z.infer<typeof initializeCheckoutSchema>;
