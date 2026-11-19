import { Router } from "express";
import { CheckoutController } from "../controllers/checkout.controller";
import { createRateLimiter } from "../middleware/rateLimit";

const router = Router();

const checkoutInitLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 15,
  message: "Too many checkout requests. Please wait a minute and try again.",
});

const orderLookupLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: "Too many order lookup requests. Please wait a minute and try again.",
});

// 1-Step Checkout Initialization & Promo Validation (Public, rate-limited)
router.post("/initialize", checkoutInitLimiter, CheckoutController.initialize);
router.post("/validate-promo", checkoutInitLimiter, CheckoutController.validatePromo);

// Dev Simulation Endpoint
router.post("/simulate-payment", CheckoutController.simulatePayment);

// Public Order Receipt Details (rate-limited against enumeration)
router.get("/orders/:orderNumber", orderLookupLimiter, CheckoutController.getOrder);

export default router;
