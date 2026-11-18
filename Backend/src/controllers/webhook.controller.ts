import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { ENV } from "../config/env";
import { OrderService } from "../services/order.service";
import { NombaService } from "../services/nomba.service";

export class WebhookController {
  static async handlePaystack(
    req: Request & { rawBody?: Buffer },
    res: Response,
    next: NextFunction
  ) {
    try {
      const secret = ENV.PAYSTACK_SECRET_KEY;
      const signature = req.headers["x-paystack-signature"] as string | undefined;

      // Fail closed in production when secret or signature is missing
      if (!secret || secret.includes("placeholder") || !signature) {
        if (ENV.NODE_ENV === "production" || signature) {
          console.warn("Missing or unconfigured Paystack webhook signature");
          return res.status(401).send("Invalid signature");
        }
      } else {
        const payload = req.rawBody ?? Buffer.from(JSON.stringify(req.body));
        const expectedHex = crypto
          .createHmac("sha512", secret)
          .update(payload)
          .digest("hex");

        const expectedBuf = Buffer.from(expectedHex, "utf8");
        const sigBuf = Buffer.from(signature, "utf8");

        if (
          expectedBuf.length !== sigBuf.length ||
          !crypto.timingSafeEqual(expectedBuf, sigBuf)
        ) {
          console.warn("Invalid Paystack webhook signature detected");
          return res.status(401).send("Invalid signature");
        }
      }

      const event = req.body;

      // 2. Process successful charge
      if (event.event === "charge.success") {
        const reference = event.data.reference;
        console.log(`⚡ Processing verified Paystack charge.success for ref: ${reference}`);
        await OrderService.completePayment(reference);
      }

      // Always acknowledge webhook with 200 OK
      return res.status(200).json({ received: true });
    } catch (error) {
      console.error("Paystack Webhook Handler Error:", error);
      return res.status(200).json({ received: true, error: "Processing logged" });
    }
  }

  static async handleNomba(
    req: Request & { rawBody?: Buffer },
    res: Response,
    next: NextFunction
  ) {
    try {
      const signature = (req.headers["x-nomba-signature"] ||
        req.headers["x-webhook-signature"]) as string | undefined;

      // Fail closed in production when signature or secret is missing
      const hasNombaSecret = Boolean(ENV.NOMBA_WEBHOOK_SECRET || ENV.NOMBA_PRIVATE_KEY);
      if (ENV.NODE_ENV === "production" && (!signature || !hasNombaSecret)) {
        console.warn("⚠️ Missing Nomba webhook signature or secret in production");
        return res.status(401).send("Invalid signature");
      }

      if (signature && hasNombaSecret) {
        const payload = req.rawBody ?? JSON.stringify(req.body);
        const isValid = NombaService.verifyWebhookSignature(signature, payload);
        if (!isValid) {
          console.warn("⚠️ Invalid Nomba webhook signature");
          return res.status(401).send("Invalid signature");
        }
      }

      const body = req.body;
      const data = body.data || body;
      const reference = data.orderReference || data.accountRef || data.virtualAccountReference || data.reference;

      if (reference) {
        console.log(`⚡ Processing verified Nomba payment webhook for ref: ${reference}`);
        await OrderService.completePayment(reference);
      }

      return res.status(200).json({ status: "success" });
    } catch (error) {
      console.error("Nomba Webhook Handler Error:", error);
      return res.status(200).json({ received: true, error: "Processing logged" });
    }
  }
}
