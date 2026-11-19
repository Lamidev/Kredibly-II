import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { PublicStoreService } from "../services/public.service";
import { EmailService } from "../services/email.service";

const customInquirySchema = z.object({
  name: z.string().min(2, "Name is required").max(120),
  phone: z.string().min(7, "Phone number is required").max(40),
  email: z.string().email("Valid email address is required"),
  projectType: z.string().min(2).max(120),
  budget: z.string().max(120).optional(),
  timeline: z.string().min(2).max(80),
  details: z.string().max(2000).optional(),
});

const newsletterSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

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

  static async submitCustomInquiry(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = customInquirySchema.parse(req.body);
      await EmailService.sendCustomBuildInquiryEmail(payload);

      return res.status(200).json({
        success: true,
        message: "Your request has been sent! Check your email for confirmation.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async subscribeNewsletter(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = newsletterSchema.parse(req.body);
      await EmailService.sendNewsletterWelcomeEmail(email);

      return res.status(200).json({
        success: true,
        message: "You're in the loop! Check your inbox for a welcome note.",
      });
    } catch (error) {
      next(error);
    }
  }
}
