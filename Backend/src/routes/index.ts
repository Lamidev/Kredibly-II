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
import customerRouter from "./customer.routes";
import storeRouter from "./store.routes";
import adminRouter from "./admin.routes";
import shopperRouter from "./shopper.routes";
import subscriptionRouter from "./subscription.routes";

const router = Router();

// Health check
router.use("/health", healthRouter);

// Public Storefront & Products
router.use("/public", publicRouter);

// 1-Step Checkout Engine
router.use("/checkout", checkoutRouter);

// Automated Webhook Receivers (Nomba — supports both /webhooks/* and /payments/webhook/*)
router.use("/webhooks", webhookRouter);
router.use("/payments/webhook", webhookRouter);
router.use("/payments/webhooks", webhookRouter);

// Merchant Authentication & Store Identity
router.use("/auth", authRouter);

// Merchant Product Catalog & Management (authenticated)
router.use("/products", productRouter);

// Merchant Orders & Fulfillment (authenticated)
router.use("/orders", orderAdminRouter);

// Merchant Financial Wallet & Payouts (authenticated)
router.use("/wallet", walletRouter);

// Merchant Customers & Purchase Records (authenticated)
router.use("/customers", customerRouter);

// Merchant Store Settings & Profile (authenticated)
router.use("/store", storeRouter);

// Local VPS Image Upload (authenticated)
router.use("/upload", uploadRouter);

// Platform Super Admin (authenticated + ADMIN role)
router.use("/admin", adminRouter);

// Storefront Optional Shopper Accounts & Profiles
router.use("/shopper", shopperRouter);

// Merchant Subscriptions & Plan Billing (authenticated)
router.use("/subscription", subscriptionRouter);

export default router;
