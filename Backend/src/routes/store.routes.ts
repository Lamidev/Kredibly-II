import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../config/db";
import { AppError } from "../middleware/errorHandler";

const router = Router();
router.use(requireAuth);

const storeSettingsSchema = z.object({
  name: z.string().min(2, "Store name must be at least 2 characters").optional(),
  description: z.string().max(500, "Description must be under 500 characters").optional().nullable(),
  whatsappNumber: z.string().min(10, "Enter a valid WhatsApp number").max(16).optional(),
  logoUrl: z.string().optional().nullable(),
  bannerUrl: z.string().optional().nullable(),
  themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional(),
  passFeeToCustomer: z.boolean().optional(),
});

/**
 * GET /api/store/settings
 */
router.get("/settings", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.storeId!;
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        whatsappNumber: true,
        logoUrl: true,
        bannerUrl: true,
        themeColor: true,
        currency: true,
        subscriptionTier: true,
        passFeeToCustomer: true,
      },
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
        ...(validated.logoUrl !== undefined ? { logoUrl: validated.logoUrl || null } : {}),
        ...(validated.bannerUrl !== undefined ? { bannerUrl: validated.bannerUrl || null } : {}),
        ...(validated.themeColor !== undefined ? { themeColor: validated.themeColor } : {}),
        ...(validated.passFeeToCustomer !== undefined ? { passFeeToCustomer: validated.passFeeToCustomer } : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        whatsappNumber: true,
        logoUrl: true,
        bannerUrl: true,
        themeColor: true,
        currency: true,
        subscriptionTier: true,
        passFeeToCustomer: true,
      },
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
