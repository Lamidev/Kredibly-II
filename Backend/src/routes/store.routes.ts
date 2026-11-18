import { Prisma } from "@prisma/client";
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../config/db";
import { AppError } from "../middleware/errorHandler";

const router = Router();
router.use(requireAuth);

const socialLinksSchema = z
  .object({
    instagram: z.string().max(120).optional().nullable(),
    tiktok: z.string().max(120).optional().nullable(),
    facebook: z.string().max(160).optional().nullable(),
    twitter: z.string().max(120).optional().nullable(),
  })
  .optional()
  .nullable();

const shippingConfigSchema = z
  .object({
    defaultFee: z.coerce.number().min(0).default(0),
    freeDeliveryEnabled: z.boolean().default(false),
    freeDeliveryScope: z.enum(["ALL", "SELECTED"]).default("ALL"),
    freeDeliveryStates: z.array(z.string()).default([]),
    freeDeliveryMinOrder: z.coerce.number().min(0).optional().nullable(),
    stateRates: z.record(z.string(), z.coerce.number().min(0)).default({}),
    offerBannerEnabled: z.boolean().optional().default(false),
    offerBannerText: z.string().max(120).optional().nullable(),
    offerBannerExpiresAt: z.string().optional().nullable(),
  })
  .optional()
  .nullable();

const storeSettingsSchema = z.object({
  name: z.string().min(2, "Store name must be at least 2 characters").optional(),
  description: z.string().max(500, "Description must be under 500 characters").optional().nullable(),
  whatsappNumber: z.string().min(10, "Enter a valid WhatsApp number").max(16).optional(),
  contactPhone: z.string().max(20).optional().nullable(),
  contactEmail: z.string().email("Enter a valid support email").or(z.literal("")).optional().nullable(),
  address: z.string().max(250).optional().nullable(),
  socialLinks: socialLinksSchema,
  logoUrl: z.string().optional().nullable(),
  bannerUrl: z.string().optional().nullable(),
  themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional(),
  passFeeToCustomer: z.boolean().optional(),
  shippingConfig: shippingConfigSchema,
});

const settingsSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  whatsappNumber: true,
  contactPhone: true,
  contactEmail: true,
  address: true,
  socialLinks: true,
  logoUrl: true,
  bannerUrl: true,
  themeColor: true,
  currency: true,
  subscriptionTier: true,
  passFeeToCustomer: true,
  shippingConfig: true,
} as const;

/**
 * GET /api/store/settings
 */
router.get("/settings", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.storeId!;
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: settingsSelect,
    });

    if (!store) {
      throw new AppError("Store not found", 404);
    }

    return res.status(200).json({
      success: true,
      data: store,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/store/settings
 */
router.put("/settings", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.storeId!;
    const validated = storeSettingsSchema.parse(req.body);

    const updated = await prisma.store.update({
      where: { id: storeId },
      data: {
        ...(validated.name !== undefined ? { name: validated.name.trim() } : {}),
        ...(validated.description !== undefined ? { description: validated.description?.trim() || null } : {}),
        ...(validated.whatsappNumber !== undefined ? { whatsappNumber: validated.whatsappNumber.trim() } : {}),
        ...(validated.contactPhone !== undefined ? { contactPhone: validated.contactPhone?.trim() || null } : {}),
        ...(validated.contactEmail !== undefined ? { contactEmail: validated.contactEmail?.trim() || null } : {}),
        ...(validated.address !== undefined ? { address: validated.address?.trim() || null } : {}),
        ...(validated.socialLinks !== undefined
          ? {
              socialLinks: validated.socialLinks
                ? {
                    instagram: validated.socialLinks.instagram?.trim() || undefined,
                    tiktok: validated.socialLinks.tiktok?.trim() || undefined,
                    facebook: validated.socialLinks.facebook?.trim() || undefined,
                    twitter: validated.socialLinks.twitter?.trim() || undefined,
                  }
                : Prisma.JsonNull,
            }
          : {}),
        ...(validated.logoUrl !== undefined ? { logoUrl: validated.logoUrl || null } : {}),
        ...(validated.bannerUrl !== undefined ? { bannerUrl: validated.bannerUrl || null } : {}),
        ...(validated.themeColor !== undefined ? { themeColor: validated.themeColor } : {}),
        ...(validated.passFeeToCustomer !== undefined ? { passFeeToCustomer: validated.passFeeToCustomer } : {}),
        ...(validated.shippingConfig !== undefined
          ? {
              shippingConfig: validated.shippingConfig
                ? validated.shippingConfig
                : Prisma.JsonNull,
            }
          : {}),
      },
      select: settingsSelect,
    });

    return res.status(200).json({
      success: true,
      message: "Store settings updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

// ==================== PROMO CODE MANAGEMENT ====================

const promoCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Promo code must be at least 2 characters")
    .max(30, "Promo code must be under 30 characters")
    .regex(/^[A-Za-z0-9_-]+$/, "Use only letters, numbers, - or _"),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.coerce.number().positive("Discount value must be greater than 0"),
  minOrderAmount: z.coerce.number().min(0).optional().nullable(),
  maxUses: z.coerce.number().int().min(1).optional().nullable(),
  expiresAt: z.string().optional().nullable(),
});

router.get("/promos", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const promos = await prisma.promoCode.findMany({
      where: { storeId: req.storeId! },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ success: true, data: promos });
  } catch (error) {
    next(error);
  }
});

router.post("/promos", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = promoCodeSchema.parse(req.body);
    if (data.discountType === "PERCENTAGE" && data.discountValue > 100) {
      throw new AppError("Percentage discount cannot exceed 100%", 400);
    }

    const cleanCode = data.code.toUpperCase();
    const existing = await prisma.promoCode.findUnique({
      where: { storeId_code: { storeId: req.storeId!, code: cleanCode } },
    });
    if (existing) {
      throw new AppError(`Promo code '${cleanCode}' already exists`, 400);
    }

    const promo = await prisma.promoCode.create({
      data: {
        storeId: req.storeId!,
        code: cleanCode,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderAmount: data.minOrderAmount || null,
        maxUses: data.maxUses || null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Promo code created",
      data: promo,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/promos/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
    const existing = await prisma.promoCode.findFirst({
      where: { id: req.params.id, storeId: req.storeId! },
    });
    if (!existing) {
      throw new AppError("Promo code not found", 404);
    }

    const updated = await prisma.promoCode.update({
      where: { id: existing.id },
      data: { isActive },
    });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

router.delete("/promos/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.promoCode.findFirst({
      where: { id: req.params.id, storeId: req.storeId! },
    });
    if (!existing) {
      throw new AppError("Promo code not found", 404);
    }

    await prisma.promoCode.delete({ where: { id: existing.id } });
    return res.status(200).json({ success: true, message: "Promo code deleted" });
  } catch (error) {
    next(error);
  }
});

// ==================== WEB PUSH SUBSCRIPTIONS ====================

router.post("/push-subscribe", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z
      .object({
        endpoint: z.string().url(),
        keys: z.object({
          p256dh: z.string().min(1),
          auth: z.string().min(1),
        }),
      })
      .parse(req.body);

    await prisma.pushSubscription.upsert({
      where: { endpoint: body.endpoint },
      update: {
        storeId: req.storeId!,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
      },
      create: {
        storeId: req.storeId!,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
      },
    });

    return res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.delete("/push-subscribe", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { endpoint } = z.object({ endpoint: z.string().url() }).parse(req.body);
    await prisma.pushSubscription.deleteMany({
      where: { endpoint, storeId: req.storeId! },
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
