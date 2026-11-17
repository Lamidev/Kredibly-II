import { Router } from "express";
import { OrderAdminController } from "../controllers/order-admin.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

// All merchant order routes require authentication
router.use(requireAuth);

router.get("/", OrderAdminController.listOrders);
router.patch("/:id/status", OrderAdminController.updateStatus);

export default router;
