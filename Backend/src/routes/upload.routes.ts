import { Router } from "express";
import { UploadController, upload } from "../controllers/upload.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Upload requires authenticated merchant
router.use(requireAuth);

router.post("/", upload.array("images", 10), UploadController.uploadImages);

export default router;
