import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { prisma } from "../config/db";
import { AppError } from "../middleware/errorHandler";
import { SubscriptionService } from "../services/subscription.service";

const router = Router();
router.use(requireAuth, requireAdmin);

/**
 * GET /api/admin/overview
 */
router.get("/overview", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalStores,
      activeStores,
      totalOrders,
      paidOrdersAgg,
      feeAgg,
      pendingKycCount,
      recentOrders,
    ] = await Promise.all([
      prisma.store.count(),
      prisma.store.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.aggregate({
        where: { paymentStatus: "PAID" },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.transaction.aggregate({
        where: { type: "SALE", status: "COMPLETED" },
        _sum: { platformFee: true },
      }),
      prisma.store.count({ where: { kycStatus: "PENDING" } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          store: { select: { name: true, slug: true } },
          customer: { select: { fullName: true, phoneNumber: true } },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalStores,
        activeStores,
        totalOrders,
        paidOrdersCount: paidOrdersAgg._count.id,
        totalGmv: Number(paidOrdersAgg._sum.totalAmount || 0),
        platformFeeRevenue: Number(feeAgg._sum.platformFee || 0),
        pendingKycCount,
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/stores
 */
router.get("/stores", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = String(req.query.search || "").trim();
    const tier = String(req.query.tier || "").trim();

    const stores = await prisma.store.findMany({
      where: {
        ...(tier && tier !== "ALL" ? { subscriptionTier: tier as any } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { slug: { contains: search, mode: "insensitive" } },
                { owner: { email: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            emailVerified: true,
          },
        },
        wallet: {
          select: {
            availableBalance: true,
            escrowBalance: true,
          },
        },
        _count: {
          select: { products: true, orders: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, data: stores });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/stores/:id
 * Complete website deep-dive: orders, revenue, products, registered + guest customers
 */
router.get("/stores/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const store = await prisma.store.findUnique({
      where: { id: req.params.id },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            emailVerified: true,
            createdAt: true,
          },
        },
        wallet: true,
        products: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            slug: true,
            category: true,
            basePrice: true,
            stockQuantity: true,
            isActive: true,
            createdAt: true,
          },
        },
        orders: {
          orderBy: { createdAt: "desc" },
          include: {
            customer: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                email: true,
                isRegistered: true,
                state: true,
              },
            },
            items: true,
          },
        },
        customers: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            email: true,
            address: true,
            city: true,
            state: true,
            isRegistered: true,
            emailVerified: true,
            createdAt: true,
            orders: {
              select: {
                id: true,
                totalAmount: true,
                paymentStatus: true,
              },
            },
          },
        },
      },
    });

    if (!store) throw new AppError("Store not found", 404);

    const paidOrders = store.orders.filter((o) => o.paymentStatus === "PAID");
    const totalGmv = paidOrders.reduce(
      (sum, o) => sum + Number(o.totalAmount),
      0
    );
    const registeredCustomers = store.customers.filter((c) => c.isRegistered).length;
    const guestCustomers = store.customers.length - registeredCustomers;

    return res.status(200).json({
      success: true,
      data: {
        ...store,
        customers: store.customers.map((c) => ({
          ...c,
          ordersCount: c.orders.length,
          totalSpent: c.orders
            .filter((o) => o.paymentStatus === "PAID")
            .reduce((s, o) => s + Number(o.totalAmount), 0),
        })),
        stats: {
          totalGmv,
          paidOrdersCount: paidOrders.length,
          totalOrders: store.orders.length,
          totalProducts: store.products.length,
          totalCustomers: store.customers.length,
          registeredCustomers,
          guestCustomers,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/stores/:id
 */
router.patch("/stores/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      subscriptionTier: z.enum(["STARTER", "PRO", "BUSINESS"]).optional(),
      isActive: z.boolean().optional(),
      clearWithdrawalLock: z.boolean().optional(),
    });
    const body = schema.parse(req.body);

    const existing = await prisma.store.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError("Store not found", 404);

    const updated = await prisma.store.update({
      where: { id: existing.id },
      data: {
        ...(body.subscriptionTier !== undefined
          ? { subscriptionTier: body.subscriptionTier }
          : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        ...(body.clearWithdrawalLock ? { withdrawalLockedUntil: null } : {}),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Store updated",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/stores/:id
 */
router.delete("/stores/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.store.findUnique({
      where: { id: req.params.id },
      select: { id: true, ownerId: true },
    });
    if (!existing) throw new AppError("Store not found", 404);

    await prisma.user.delete({ where: { id: existing.ownerId } });
    return res.status(200).json({ success: true, message: "Merchant account and store deleted" });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/orders
 */
router.get("/orders", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = String(req.query.status || "").trim();
    const search = String(req.query.search || "").trim();

    const orders = await prisma.order.findMany({
      where: {
        ...(status && status !== "ALL" ? { orderStatus: status as any } : {}),
        ...(search
          ? {
              OR: [
                { orderNumber: { contains: search, mode: "insensitive" } },
                { store: { name: { contains: search, mode: "insensitive" } } },
                { customer: { fullName: { contains: search, mode: "insensitive" } } },
                { customer: { phoneNumber: { contains: search } } },
              ],
            }
          : {}),
      },
      include: {
        store: { select: { name: true, slug: true } },
        customer: { select: { fullName: true, phoneNumber: true, state: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/orders/:id/status
 */
router.patch("/orders/:id/status", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderStatus } = z
      .object({
        orderStatus: z.enum([
          "PENDING",
          "PAID",
          "PROCESSING",
          "SHIPPED",
          "DELIVERED",
          "CANCELLED",
        ]),
      })
      .parse(req.body);

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { orderStatus },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/payouts
 */
router.get("/payouts", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = String(req.query.type || "").trim();

    const transactions = await prisma.transaction.findMany({
      where: {
        ...(type && type !== "ALL" ? { type } : {}),
      },
      include: {
        wallet: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
                slug: true,
                bankName: true,
                accountNumber: true,
                accountName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 150,
    });

    return res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/kyc
 */
router.get("/kyc", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = String(req.query.status || "").trim();
    const stores = await prisma.store.findMany({
      where: {
        ...(status && status !== "ALL" ? { kycStatus: status } : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        kycStatus: true,
        kycIdType: true,
        kycIdLast4: true,
        kycVerifiedName: true,
        kycVerifiedAt: true,
        bankName: true,
        accountNumber: true,
        accountName: true,
        owner: {
          select: { fullName: true, email: true, phoneNumber: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return res.status(200).json({ success: true, data: stores });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/stores/:id
 * Complete website deep-dive: orders, revenue, products, registered + guest customers
 */
router.get("/stores/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const store = await prisma.store.findUnique({
      where: { id: req.params.id },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            emailVerified: true,
            createdAt: true,
          },
        },
        wallet: true,
        products: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            slug: true,
            category: true,
            basePrice: true,
            stockQuantity: true,
            isActive: true,
            createdAt: true,
          },
        },
        orders: {
          orderBy: { createdAt: "desc" },
          include: {
            customer: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                email: true,
                isRegistered: true,
                state: true,
              },
            },
            items: true,
          },
        },
        customers: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            email: true,
            address: true,
            city: true,
            state: true,
            isRegistered: true,
            emailVerified: true,
            createdAt: true,
            orders: {
              select: {
                id: true,
                totalAmount: true,
                paymentStatus: true,
              },
            },
          },
        },
      },
    });

    if (!store) throw new AppError("Store not found", 404);

    const paidOrders = store.orders.filter((o) => o.paymentStatus === "PAID");
    const totalGmv = paidOrders.reduce(
      (sum, o) => sum + Number(o.totalAmount),
      0
    );
    const registeredCustomers = store.customers.filter((c) => c.isRegistered).length;
    const guestCustomers = store.customers.length - registeredCustomers;

    return res.status(200).json({
      success: true,
      data: {
        ...store,
        customers: store.customers.map((c) => ({
          ...c,
          ordersCount: c.orders.length,
          totalSpent: c.orders
            .filter((o) => o.paymentStatus === "PAID")
            .reduce((s, o) => s + Number(o.totalAmount), 0),
        })),
        stats: {
          totalGmv,
          paidOrdersCount: paidOrders.length,
          totalOrders: store.orders.length,
          totalProducts: store.products.length,
          totalCustomers: store.customers.length,
          registeredCustomers,
          guestCustomers,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/kyc/:storeId
 */
router.patch("/kyc/:storeId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = z
      .object({ status: z.enum(["VERIFIED", "REJECTED", "PENDING", "UNVERIFIED"]) })
      .parse(req.body);

    const updated = await prisma.store.update({
      where: { id: req.params.storeId },
      data: {
        kycStatus: status,
        kycVerifiedAt: status === "VERIFIED" ? new Date() : null,
      },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/subscriptions
 */
router.get("/subscriptions", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await SubscriptionService.getAdminOverview();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/subscriptions/plans/:tier
 */
router.put("/subscriptions/plans/:tier", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tier = z
      .enum(["STARTER", "STARTER_PLUS", "PRO", "BUSINESS"])
      .parse(req.params.tier);

    const body = z
      .object({
        name: z.string().min(2).optional(),
        tagline: z.string().max(250).optional().nullable(),
        monthlyPrice: z.coerce.number().min(0).optional(),
        annualPrice: z.coerce.number().min(0).optional(),
        maxProducts: z.coerce.number().int().min(1).optional(),
        maxImagesPerProduct: z.coerce.number().int().min(1).max(10).optional(),
        platformFeePercent: z.coerce.number().min(0).max(20).optional(),
        allowPassFee: z.boolean().optional(),
        allowPromoCodes: z.boolean().optional(),
        allowOfferBanner: z.boolean().optional(),
        allowCustomDomain: z.boolean().optional(),
        isActive: z.boolean().optional(),
      })
      .parse(req.body);

    const updated = await SubscriptionService.updatePlanConfig(tier, body);
    return res.status(200).json({
      success: true,
      message: `${updated.name} configuration updated`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/push-subscribe
 */
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
        isAdmin: true,
        storeId: null,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
      },
      create: {
        isAdmin: true,
        storeId: null,
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

/**
 * DELETE /api/admin/push-subscribe
 */
router.delete("/push-subscribe", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { endpoint } = z.object({ endpoint: z.string().url() }).parse(req.body);
    await prisma.pushSubscription.deleteMany({
      where: { endpoint, isAdmin: true },
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
