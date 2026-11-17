import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../config/db";

const router = Router();
router.use(requireAuth);

/**
 * GET /api/customers
 * Returns all customers for the merchant's store with purchase aggregates
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.storeId!;
    const search = (req.query.search as string)?.trim() || "";

    const customers = await prisma.customer.findMany({
      where: {
        storeId,
        ...(search
          ? {
              OR: [
                { fullName: { contains: search, mode: "insensitive" } },
                { phoneNumber: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            orderStatus: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = customers.map((c) => {
      const paidOrders = c.orders.filter((o) => o.paymentStatus === "PAID");
      const totalSpent = paidOrders.reduce(
        (sum, o) => sum + Number(o.totalAmount),
        0
      );

      return {
        id: c.id,
        fullName: c.fullName,
        phoneNumber: c.phoneNumber,
        email: c.email,
        address: c.address,
        city: c.city,
        state: c.state,
        createdAt: c.createdAt,
        totalOrders: c.orders.length,
        paidOrdersCount: paidOrders.length,
        totalSpent,
        lastOrderAt: c.orders[0]?.createdAt || null,
        recentOrders: c.orders.slice(0, 5),
      };
    });

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
