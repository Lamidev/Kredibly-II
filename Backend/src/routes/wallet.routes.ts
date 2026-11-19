import { Router } from "express";
import { WalletController } from "../controllers/wallet.controller";
import { requireAuth } from "../middleware/auth";
import { createRateLimiter } from "../middleware/rateLimit";

const router = Router();

const otpRequestLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 6,
  message: "Too many confirmation code requests. Please wait 15 minutes and try again.",
});

const sensitiveWalletLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many withdrawal or bank update attempts. Please wait 15 minutes and try again.",
});

// All merchant wallet operations require authentication
router.use(requireAuth);

router.get("/", WalletController.getWallet);
router.post("/verify-bank", sensitiveWalletLimiter, WalletController.verifyBank);
router.post("/request-bank-otp", otpRequestLimiter, WalletController.requestBankChangeOtp);
router.put("/bank-details", sensitiveWalletLimiter, WalletController.updateBankDetails);
router.post("/request-withdrawal-otp", otpRequestLimiter, WalletController.requestWithdrawalOtp);
router.post("/withdraw", sensitiveWalletLimiter, WalletController.withdraw);

export default router;
