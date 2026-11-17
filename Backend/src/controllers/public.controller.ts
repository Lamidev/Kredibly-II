import { Request, Response, NextFunction } from "express";
import { PublicStoreService } from "../services/public.service";

export class PublicController {
  static async getStore(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = req.params.storeSlug;
      const store = await PublicStoreService.getStoreBySlug(slug);

      return res.status(200).json({
        success: true,
        data: store,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { storeSlug, productSlug } = req.params;
      const data = await PublicStoreService.getProductBySlug(storeSlug, productSlug);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async trackOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { storeSlug } = req.params;
      const query = (req.query.q || req.query.query || "") as string;
      const data = await PublicStoreService.trackOrders(storeSlug, query);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}
