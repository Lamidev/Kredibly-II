import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

// All merchant product routes require authentication
router.use(requireAuth);

router.post("/", ProductController.create);
router.get("/", ProductController.list);
router.get("/:id", ProductController.getById);
router.put("/:id", ProductController.update);
router.patch("/:id/stock", ProductController.updateStock);
router.delete("/:id", ProductController.delete);

export default router;
