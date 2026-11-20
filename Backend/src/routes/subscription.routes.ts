import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { SubscriptionService } from "../services/subscription.service";

const router = Router();
router.use(requireAuth);

router.get("/overview", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await SubscriptionService.getMerchantOverview(req.storeId!);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.post("/upgrade-wallet", async (req: Request, res: Response, next: NextFunction) => {
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
});

router.post("/upgrade-card", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z
      .object({
        tier: z.enum(["STARTER_PLUS", "PRO", "BUSINESS"]),
        billingCycle: z.enum(["MONTHLY", "ANNUAL"]).default("MONTHLY"),
      })
      .parse(req.body);

    const data = await SubscriptionService.initializePaystackUpgrade(
      req.storeId!,
      body.tier,
      body.billingCycle,
      req.user!.email
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.post("/verify-card", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z.object({ reference: z.string().min(4) }).parse(req.body);
    const data = await SubscriptionService.verifyPaystackUpgrade(
      req.storeId!,
      body.reference
    );
    return res.status(200).json({
      success: true,
      message: "Subscription payment verified and activated!",
      data,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
