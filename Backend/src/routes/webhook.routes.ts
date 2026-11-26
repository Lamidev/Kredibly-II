import { Router } from "express";
import { WebhookController } from "../controllers/webhook.controller";

const router = Router();

// Nomba automated webhook listener (DVA bank transfer & Checkout)
router.post("/nomba", WebhookController.handleNomba);

// Paystack automated webhook listener (DVA bank transfer, OPay & Card Checkout)
router.post("/paystack", WebhookController.handlePaystack);

export default router;
