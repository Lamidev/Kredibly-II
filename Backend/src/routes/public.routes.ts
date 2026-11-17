import { Router } from "express";
import { PublicController } from "../controllers/public.controller";

const router = Router();

// Public routes (no authentication required)
router.get("/stores/:storeSlug", PublicController.getStore);
router.get("/stores/:storeSlug/track", PublicController.trackOrders);
router.get("/stores/:storeSlug/products/:productSlug", PublicController.getProduct);

export default router;
