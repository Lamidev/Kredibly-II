import { prisma } from "../config/db";
import { AppError } from "../middleware/errorHandler";
import { OrderStatus } from "@prisma/client";

export class FulfillmentService {
  /**
   * Get orders for merchant's active store with filtering
   */
  static async getStoreOrders(
    storeId: string,
    query?: { status?: string; search?: string }
  ) {
    const whereClause: any = { storeId, paymentStatus: "PAID" };

    if (query?.status && query.status !== "ALL") {
      whereClause.orderStatus = query.status as OrderStatus;
    }

    if (query?.search) {
      whereClause.OR = [
        { orderNumber: { contains: query.search.trim(), mode: "insensitive" } },
        { customer: { fullName: { contains: query.search.trim(), mode: "insensitive" } } },
        { customer: { phoneNumber: { contains: query.search.trim() } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: { images: true, slug: true },
            },
          },
        },
        transaction: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return orders;
  }

  /**
   * Update order fulfillment status (PAID -> PROCESSING -> SHIPPED -> DELIVERED / CANCELLED)
   */
  static async updateOrderStatus(
    storeId: string,
    orderId: string,
    newStatus: OrderStatus
  ) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, storeId },
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (newStatus === "DELIVERED" && order.paymentStatus !== "PAID") {
      throw new AppError("Cannot mark an unpaid order as delivered", 400);
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { orderStatus: newStatus },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: { images: true, slug: true },
            },
          },
        },
      },
    });

    return updated;
  }
}
