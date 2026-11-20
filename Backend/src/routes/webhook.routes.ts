import { Router } from "express";
import { WebhookController } from "../controllers/webhook.controller";

const router = Router();

// Nomba automated webhook listener (DVA bank transfer & Checkout)
router.post("/nomba", WebhookController.handleNomba);

export default router;
