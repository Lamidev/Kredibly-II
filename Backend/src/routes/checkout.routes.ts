import { Router } from "express";
import { CheckoutController } from "../controllers/checkout.controller";

const router = Router();

// 1-Step Checkout Initialization & Promo Validation (Public)
router.post("/initialize", CheckoutController.initialize);
router.post("/validate-promo", CheckoutController.validatePromo);

// Dev Simulation Endpoint
router.post("/simulate-payment", CheckoutController.simulatePayment);

// Public Order Receipt Details
router.get("/orders/:orderNumber", CheckoutController.getOrder);

export default router;
