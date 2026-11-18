import { Request, Response, NextFunction } from "express";
import { ENV } from "../config/env";
import { OrderService } from "../services/order.service";
import {
  initializeCheckoutSchema,
  validatePromoSchema,
} from "../validators/order.validator";

export class CheckoutController {
  static async initialize(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = initializeCheckoutSchema.parse(req.body);
      const result = await OrderService.initializeCheckout(validated);

      return res.status(201).json({
        success: true,
        message: "Order initialized successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async validatePromo(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = validatePromoSchema.parse(req.body);
      const result = await OrderService.validatePromoPreview(
        validated.storeSlug,
        validated.code,
        validated.subtotal
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async simulatePayment(req: Request, res: Response, next: NextFunction) {
    try {
      if (ENV.NODE_ENV === "production") {
        return res.status(404).json({ success: false, message: "Not found" });
      }

      const reference = (req.body.reference || req.query.ref) as string;
      if (!reference) {
        return res.status(400).json({ success: false, message: "Payment reference is required" });
      }

      const result = await OrderService.completePayment(reference);

      return res.status(200).json({
        success: true,
        message: "Simulated payment successful, stock locked and escrow credited",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const orderNumber = req.params.orderNumber;
      const order = await OrderService.getOrderDetails(orderNumber);

      return res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }
}
