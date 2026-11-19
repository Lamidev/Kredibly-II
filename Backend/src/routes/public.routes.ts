import { Router } from "express";
import { PublicController } from "../controllers/public.controller";
import { createRateLimiter } from "../middleware/rateLimit";

const router = Router();

const trackLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: "Too many order lookup requests. Please wait a minute and try again.",
});

const inquiryLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many requests. Please try again in a few minutes.",
});

// Public routes (no authentication required)
router.get("/stores/:storeSlug", PublicController.getStore);
router.get("/stores/:storeSlug/track", trackLimiter, PublicController.trackOrders);
router.get("/stores/:storeSlug/products/:productSlug", PublicController.getProduct);
router.post("/custom-inquiry", inquiryLimiter, PublicController.submitCustomInquiry);
router.post("/newsletter", inquiryLimiter, PublicController.subscribeNewsletter);

export default router;
