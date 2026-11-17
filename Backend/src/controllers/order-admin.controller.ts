import { Request, Response, NextFunction } from "express";
import { FulfillmentService } from "../services/fulfillment.service";
import { OrderStatus } from "@prisma/client";

export class OrderAdminController {
  static async listOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const storeId = req.storeId!;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;

      const orders = await FulfillmentService.getStoreOrders(storeId, { status, search });

      return res.status(200).json({
        success: true,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const storeId = req.storeId!;
      const orderId = req.params.id;
      const { status } = req.body;

      if (!status || !Object.values(OrderStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Valid order status is required",
        });
      }

      const updated = await FulfillmentService.updateOrderStatus(
        storeId,
        orderId,
        status as OrderStatus
      );

      return res.status(200).json({
        success: true,
        message: `Order status updated to ${status}`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}
