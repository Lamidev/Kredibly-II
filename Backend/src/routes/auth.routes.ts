import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";
import { createRateLimiter } from "../middleware/rateLimit";

const router = Router();

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: "Too many authentication attempts. Please wait 15 minutes and try again.",
});

// Public auth endpoints (rate-limited)
router.post("/register", authLimiter, AuthController.register);
router.post("/verify-email", authLimiter, AuthController.verifyEmail);
router.post("/resend-verification", authLimiter, AuthController.resendVerification);
router.post("/login", authLimiter, AuthController.login);
router.post("/forgot-password", authLimiter, AuthController.forgotPassword);
router.post("/reset-password", authLimiter, AuthController.resetPassword);
router.get("/check-slug", AuthController.checkSlug);

// Authenticated merchant endpoints
router.get("/me", requireAuth, AuthController.getMe);
router.put("/bank-details", requireAuth, AuthController.updateBankDetails);

export default router;
