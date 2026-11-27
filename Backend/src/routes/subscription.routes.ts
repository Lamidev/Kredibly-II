import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { createRateLimiter } from "../middleware/rateLimit";
import { SubscriptionService } from "../services/subscription.service";

const router = Router();
router.use(requireAuth);

const subscriptionActionLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: "Too many subscription requests. Please wait a few minutes and try again.",
});

router.get("/overview", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await SubscriptionService.getMerchantOverview(req.storeId!);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/upgrade-wallet",
  subscriptionActionLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = z
        .object({
          tier: z.enum(["STARTER_PLUS", "PRO", "BUSINESS"]),
          billingCycle: z.enum(["MONTHLY", "ANNUAL"]).default("MONTHLY"),
        })
        .parse(req.body);

      const data = await SubscriptionService.upgradeWithWallet(
        req.storeId!,
        body.tier,
        body.billingCycle
      );
      return res.status(200).json({
        success: true,
        message: "Subscription activated from your Kredibly Wallet!",
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/upgrade-checkout",
  subscriptionActionLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = z
        .object({
          tier: z.enum(["STARTER_PLUS", "PRO", "BUSINESS"]),
          billingCycle: z.enum(["MONTHLY", "ANNUAL"]).default("MONTHLY"),
        })
        .parse(req.body);

      const data = await SubscriptionService.initializePaystackCheckoutUpgrade(
        req.storeId!,
        body.tier,
        body.billingCycle,
        req.user!.email
      );
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/upgrade-transfer",
  subscriptionActionLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = z
        .object({
          tier: z.enum(["STARTER_PLUS", "PRO", "BUSINESS"]),
          billingCycle: z.enum(["MONTHLY", "ANNUAL"]).default("MONTHLY"),
        })
        .parse(req.body);

      const data = await SubscriptionService.initializeNombaTransferUpgrade(
        req.storeId!,
        body.tier,
        body.billingCycle,
        req.user!.email
      );
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/verify-transfer",
  subscriptionActionLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = z.object({ reference: z.string().min(4) }).parse(req.body);
      const data = await SubscriptionService.verifyNombaTransferUpgrade(
        req.storeId!,
        body.reference
      );
      return res.status(200).json({
        success: true,
        message: "Transfer confirmed and subscription activated!",
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
