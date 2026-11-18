import { Router } from "express";
import { WalletController } from "../controllers/wallet.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

// All merchant wallet operations require authentication
router.use(requireAuth);

router.get("/", WalletController.getWallet);
router.post("/verify-bank", WalletController.verifyBank);
router.post("/request-bank-otp", WalletController.requestBankChangeOtp);
router.put("/bank-details", WalletController.updateBankDetails);
router.post("/request-withdrawal-otp", WalletController.requestWithdrawalOtp);
router.post("/withdraw", WalletController.withdraw);

export default router;
