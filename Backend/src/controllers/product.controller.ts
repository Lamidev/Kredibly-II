import { Request, Response, NextFunction } from "express";
import { ProductService } from "../services/product.service";
import {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
} from "../validators/product.validator";

export class ProductController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const storeId = req.storeId!;
      const validated = createProductSchema.parse(req.body);
      const product = await ProductService.createProduct(storeId, validated);

      return res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const storeId = req.storeId!;
      const search = req.query.search as string | undefined;
      const products = await ProductService.getMerchantProducts(storeId, { search });

      return res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const storeId = req.storeId!;
      const productId = req.params.id;
      const product = await ProductService.getProductById(storeId, productId);

      return res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const storeId = req.storeId!;
      const productId = req.params.id;
      const validated = updateProductSchema.parse(req.body);
      const updated = await ProductService.updateProduct(storeId, productId, validated);

      return res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStock(req: Request, res: Response, next: NextFunction) {
    try {
      const storeId = req.storeId!;
      const productId = req.params.id;
      const validated = updateStockSchema.parse(req.body);
      const updated = await ProductService.updateStock(storeId, productId, validated);

      return res.status(200).json({
        success: true,
        message: "Stock updated",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const storeId = req.storeId!;
      const productId = req.params.id;
      const result = await ProductService.deleteProduct(storeId, productId);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
