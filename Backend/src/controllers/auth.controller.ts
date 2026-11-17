import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import {
  registerSchema,
  loginSchema,
  bankDetailsSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.validator";

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const result = await AuthService.register(validatedData);

      return res.status(201).json({
        success: true,
        message: "Merchant account and store created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await AuthService.login(validatedData);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const user = await AuthService.getMe(userId);

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async checkSlug(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = (req.query.slug as string) || "";
      const result = await AuthService.checkSlug(slug);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateBankDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const storeId = req.storeId;
      if (!storeId) {
        return res.status(400).json({
          success: false,
          message: "No active store associated with this merchant account",
        });
      }

      const validatedData = bankDetailsSchema.parse(req.body);
      const result = await AuthService.updateBankDetails(storeId, validatedData);

      return res.status(200).json({
        success: true,
        message: "Payout bank account updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = forgotPasswordSchema.parse(req.body);
      const result = await AuthService.forgotPassword(validatedData.email);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = resetPasswordSchema.parse(req.body);
      const result = await AuthService.resetPassword(
        validatedData.token,
        validatedData.newPassword
      );

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
