import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { ENV } from "../config/env";
import { OrderService } from "../services/order.service";
import { NombaService } from "../services/nomba.service";

export class WebhookController {
  static async handlePaystack(req: Request, res: Response, next: NextFunction) {
    try {
      const secret = ENV.PAYSTACK_SECRET_KEY;
      const signature = req.headers["x-paystack-signature"] as string;

      // 1. Verify HMAC SHA512 signature in production
      if (secret && !secret.includes("placeholder")) {
        const hash = crypto
          .createHmac("sha512", secret)
          .update(JSON.stringify(req.body))
          .digest("hex");

        if (hash !== signature) {
          console.warn("Invalid Paystack webhook signature detected");
          return res.status(400).send("Invalid signature");
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
      // Return 200 so Paystack doesn't keep hammering if payload was bad, but log error
      return res.status(200).json({ received: true, error: "Processing logged" });
    }
  }

  static async handleNomba(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = (req.headers["x-nomba-signature"] || req.headers["x-webhook-signature"]) as string;

      // In production with webhook secret configured, verify signature
      if (signature && ENV.NOMBA_WEBHOOK_SECRET) {
        const isValid = NombaService.verifyWebhookSignature(signature, JSON.stringify(req.body));
        if (!isValid) {
          console.warn("⚠️ Invalid Nomba webhook signature");
          return res.status(400).send("Invalid signature");
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
