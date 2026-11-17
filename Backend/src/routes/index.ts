import { Router } from "express";
import healthRouter from "./health.routes";
import authRouter from "./auth.routes";
import productRouter from "./product.routes";
import uploadRouter from "./upload.routes";
import publicRouter from "./public.routes";
import checkoutRouter from "./checkout.routes";
import webhookRouter from "./webhook.routes";
import orderAdminRouter from "./order-admin.routes";
import walletRouter from "./wallet.routes";

const router = Router();

// Health check
router.use("/health", healthRouter);

// Public Storefront & Products
router.use("/public", publicRouter);

// 1-Step Checkout Engine
router.use("/checkout", checkoutRouter);

// Automated Webhook Receivers (Paystack)
router.use("/webhooks", webhookRouter);

// Merchant Authentication & Store Identity
router.use("/auth", authRouter);

// Merchant Product Catalog & Management (authenticated)
router.use("/products", productRouter);

// Merchant Orders & Fulfillment (authenticated)
router.use("/orders", orderAdminRouter);

// Merchant Financial Wallet & Payouts (authenticated)
router.use("/wallet", walletRouter);

// Local VPS Image Upload (authenticated)
router.use("/upload", uploadRouter);

export default router;
