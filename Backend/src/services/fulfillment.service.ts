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
    const whereClause: any = { storeId };

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
        items: true,
        transaction: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return orders;
  }

  /**
   * Update order fulfillment status & trigger escrow release on delivery
   */
  static async updateOrderStatus(
    storeId: string,
    orderId: string,
    newStatus: OrderStatus
  ) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, storeId },
      include: {
        store: { include: { wallet: true } },
        transaction: true,
      },
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // If already in that status, return
    if (order.orderStatus === newStatus) {
      return order;
    }

    // Escrow Release Engine: Triggered when order is marked DELIVERED
    if (newStatus === "DELIVERED" && order.orderStatus !== "DELIVERED") {
      if (order.paymentStatus !== "PAID") {
        throw new AppError("Cannot mark an unpaid order as delivered", 400);
      }

      const wallet = order.store.wallet;
      if (!wallet) {
        throw new AppError("Store wallet not found", 400);
      }

      // Calculate exact net amount that was credited to escrow
      const totalAmount = Number(order.totalAmount);
      const netAmount = order.transaction
        ? Number(order.transaction.netAmount)
        : Math.round(totalAmount * 0.975 * 100) / 100;
      const platformFee = order.transaction
        ? Number(order.transaction.platformFee)
        : totalAmount - netAmount;

      return await prisma.$transaction(async (tx) => {
        // 1. Decrement escrow, increment available balance
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            escrowBalance: { decrement: netAmount },
            availableBalance: { increment: netAmount },
          },
        });

        // 2. Create ESCROW_RELEASE transaction audit record
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            amount: totalAmount,
            platformFee,
            netAmount,
            type: "ESCROW_RELEASE",
            status: "COMPLETED",
            reference: `REL-${order.orderNumber}-${Math.floor(100 + Math.random() * 900)}`,
          },
        });

        // 3. Update order status
        const updated = await tx.order.update({
          where: { id: order.id },
          data: { orderStatus: "DELIVERED" },
          include: { customer: true, items: true },
        });

        return updated;
      });
    }

    // Standard status update (PROCESSING, SHIPPED, CANCELLED)
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { orderStatus: newStatus },
      include: { customer: true, items: true },
    });

    return updated;
  }
}
