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

export default router;
