import { prisma } from "../config/db";
import { AppError } from "../middleware/errorHandler";
import { OrderStatus } from "@prisma/client";
import { EmailService } from "./email.service";

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
   * Update order fulfillment status (PAID -> SHIPPED -> DELIVERED / CANCELLED)
   * Restores stock on CANCELLED and notifies buyer via email on status updates.
   */
  static async updateOrderStatus(
    storeId: string,
    orderId: string,
    newStatus: OrderStatus
  ) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, storeId },
      include: {
        items: true,
        customer: true,
        store: { select: { name: true, slug: true } },
      },
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (newStatus === "DELIVERED" && order.paymentStatus !== "PAID") {
      throw new AppError("Cannot mark an unpaid order as delivered", 400);
    }

    if (order.orderStatus === newStatus) {
      return order;
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (newStatus === "CANCELLED") {
        // Atomically claim cancellation so double-clicks cannot restore stock twice
        const claimed = await tx.order.updateMany({
          where: { id: order.id, orderStatus: { not: "CANCELLED" } },
          data: { orderStatus: "CANCELLED" },
        });

        if (claimed.count > 0 && order.paymentStatus === "PAID") {
          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQuantity: { increment: item.quantity } },
            });
            if (item.variantId) {
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: { stockQuantity: { increment: item.quantity } },
              });
            }
          }
        }

        return tx.order.findUniqueOrThrow({ where: { id: order.id } });
      }

      return tx.order.update({
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
    });

    if (
      order.orderStatus !== newStatus &&
      order.customer?.email &&
      (newStatus === "SHIPPED" ||
        newStatus === "DELIVERED" ||
        newStatus === "CANCELLED")
    ) {
      EmailService.sendOrderStatusUpdateEmail({
        to: order.customer.email,
        customerName: order.customer.fullName,
        orderNumber: order.orderNumber,
        storeName: order.store.name,
        storeSlug: order.store.slug,
        status: newStatus,
      }).catch((err) => console.error("Buyer status update email failed:", err));
    }

    return updated;
  }
}
