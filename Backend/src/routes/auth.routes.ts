import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Public auth endpoints
router.post("/register", AuthController.register);
router.post("/verify-email", AuthController.verifyEmail);
router.post("/resend-verification", AuthController.resendVerification);
router.post("/login", AuthController.login);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);
router.get("/check-slug", AuthController.checkSlug);

// Authenticated merchant endpoints
router.get("/me", requireAuth, AuthController.getMe);
router.put("/bank-details", requireAuth, AuthController.updateBankDetails);

export default router;
