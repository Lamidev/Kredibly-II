import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db";
import { AppError } from "./errorHandler";

export const resolveStoreBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const slug = req.params.storeSlug || req.query.storeSlug as string;

    if (!slug) {
      throw new AppError("Store identifier (slug) is required", 400);
    }

    const store = await prisma.store.findUnique({
      where: { slug: slug.toLowerCase() },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        bannerUrl: true,
        themeColor: true,
        whatsappNumber: true,
        currency: true,
        subscriptionTier: true,
      },
    });

    if (!store) {
      throw new AppError(`Store '${slug}' not found`, 404);
    }

    // Attach verified store to the request
    (req as any).currentStore = store;
    req.storeId = store.id;

    next();
  } catch (error) {
    next(error);
  }
};
