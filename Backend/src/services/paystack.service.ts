import axios from "axios";
import crypto from "crypto";
import { ENV } from "../config/env";
import type {
  DynamicAccountResult,
  BankAccountResolveResult,
} from "./nomba.service";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function getHeaders() {
  if (!ENV.PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key missing in environment configuration");
  }
  return {
    Authorization: `Bearer ${ENV.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

function sanitizeEmail(email?: string, fallbackSeed = "shopper"): string {
  const trimmed = (email || "").trim();
  // Paystack rejects .internal domains; always supply a real deliverable-format email
  if (
    trimmed &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) &&
    !trimmed.endsWith(".internal")
  ) {
    return trimmed;
  }
  const cleanSeed = fallbackSeed.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "shopper";
  return `orders+${cleanSeed}@usekredibly.com`;
}

export class PaystackService {
  /**
   * Create a one-time Dynamic Virtual Account (Pay with Transfer) via Paystack Charge API.
   * Returns a live temporary bank account number right inside our custom CheckoutDrawer UI.
   */
  static async createDynamicVirtualAccount(params: {
    amount: number;
    orderNumber: string;
    merchantName?: string;
    customerEmail?: string;
  }): Promise<DynamicAccountResult> {
    const cleanOrderNumber = params.orderNumber.replace(/[^a-zA-Z0-9]/g, "");
    const reference = params.orderNumber.startsWith("SUB-")
      ? params.orderNumber
      : `KRD-${cleanOrderNumber}-${Date.now().toString().slice(-6)}`;
    const amountKobo = Math.round(params.amount * 100);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    const payload = {
      email: sanitizeEmail(params.customerEmail, cleanOrderNumber),
      amount: amountKobo,
      currency: "NGN",
      reference,
      bank_transfer: {
        account_expires_at: expiresAt,
      },
      metadata: {
        orderNumber: params.orderNumber,
        merchantName: params.merchantName || "Kredibly",
      },
    };

    try {
      const response = await axios.post(`${PAYSTACK_BASE_URL}/charge`, payload, {
        headers: getHeaders(),
        timeout: 20000,
      });

      const data = response.data?.data;
      if (!response.data?.status || !data?.account_number) {
        throw new Error(
          response.data?.message || "Paystack did not return a bank transfer account"
        );
      }

      return {
        accountNumber: data.account_number,
        bankName: data.bank?.name || "Paystack-Titan",
        accountName: data.account_name || params.merchantName || "KREDIBLY",
        reference: data.reference || reference,
        expiresAt: data.account_expires_at || expiresAt,
      };
    } catch (err: any) {
      console.error(
        "❌ Paystack Bank Transfer DVA Error:",
        err.response?.data || err.message
      );
      throw new Error(
        err.response?.data?.message || "Failed to generate bank transfer account"
      );
    }
  }

  /**
   * Initialize Paystack Checkout and return both authorizationUrl and accessCode
   * (used by Paystack Inline Popup modal `resumeTransaction(accessCode)`).
   */
  static async initializeCheckout(params: {
    amount: number;
    orderReference: string;
    customerEmail: string;
    customerName: string;
    callbackUrl: string;
    channels?: string[];
  }): Promise<{ authorizationUrl: string; accessCode: string; reference: string }> {
    const amountKobo = Math.round(params.amount * 100);
    const payload: Record<string, unknown> = {
      email: sanitizeEmail(params.customerEmail, params.orderReference),
      amount: amountKobo,
      currency: "NGN",
      reference: params.orderReference,
      callback_url: params.callbackUrl,
      metadata: {
        customerName: params.customerName,
      },
    };

    if (params.channels && params.channels.length > 0) {
      payload.channels = params.channels;
    }

    try {
      const response = await axios.post(
        `${PAYSTACK_BASE_URL}/transaction/initialize`,
        payload,
        {
          headers: getHeaders(),
          timeout: 20000,
        }
      );

      const data = response.data?.data;
      if (!response.data?.status || !data?.authorization_url || !data?.access_code) {
        throw new Error(
          response.data?.message || "Paystack checkout initialization failed"
        );
      }

      return {
        authorizationUrl: data.authorization_url,
        accessCode: data.access_code,
        reference: data.reference || params.orderReference,
      };
    } catch (err: any) {
      console.error(
        "❌ Paystack Checkout Init Error:",
        err.response?.data || err.message
      );
      throw new Error(
        err.response?.data?.message || "Failed to initialize Paystack checkout"
      );
    }
  }

  /**
   * Initialize Paystack Hosted Checkout (supports OPay, Debit/Credit Cards, Bank Transfer, USSD).
   */
  static async createCheckoutOrder(params: {
    amount: number;
    orderReference: string;
    customerEmail: string;
    customerName: string;
    callbackUrl: string;
    channels?: string[];
  }): Promise<string> {
    const res = await this.initializeCheckout(params);
    return res.authorizationUrl;
  }

  /**
   * Verify a Paystack transaction by reference (works for both Bank Transfer DVA and OPay/Card).
   */
  static async verifyPayment(
    reference: string,
    expectedAmount: number
  ): Promise<boolean> {
    try {
      const response = await axios.get(
        `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: getHeaders(),
          timeout: 15000,
        }
      );

      const data = response.data?.data;
      if (!response.data?.status || !data) return false;

      const isPaid = String(data.status || "").toLowerCase() === "success";
      const paidNaira = Number(data.amount || 0) / 100;
      const meetsAmount =
        expectedAmount <= 1 || paidNaira >= expectedAmount - 1;

      return isPaid && meetsAmount;
    } catch (err: any) {
      const status = err.response?.status;
      if (status !== 404 && status !== 400) {
        console.warn(
          "Paystack verify lookup error:",
          err.response?.data?.message || err.message
        );
      }
      return false;
    }
  }

  /**
   * Verify Paystack webhook HMAC-SHA512 signature (`x-paystack-signature`).
   */
  static verifyWebhookSignature(
    signature: string,
    rawPayload: string | Buffer
  ): boolean {
    const secret = ENV.PAYSTACK_SECRET_KEY;
    if (!secret || !signature) return false;

    const hash = crypto
      .createHmac("sha512", secret)
      .update(rawPayload)
      .digest("hex");

    const expectedBuf = Buffer.from(hash, "utf8");
    const receivedBuf = Buffer.from(signature.trim(), "utf8");
    if (expectedBuf.length !== receivedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  }

  /**
   * Resolve a Nigerian bank account name via Paystack (`GET /bank/resolve`).
   */
  static async resolveAccount(
    accountNumber: string,
    bankCode: string
  ): Promise<BankAccountResolveResult> {
    try {
      const response = await axios.get(`${PAYSTACK_BASE_URL}/bank/resolve`, {
        params: {
          account_number: accountNumber,
          bank_code: bankCode,
        },
        headers: getHeaders(),
        timeout: 15000,
      });

      const data = response.data?.data;
      if (!response.data?.status || !data?.account_name) {
        throw new Error(
          response.data?.message || "Could not verify bank account name"
        );
      }

      return {
        accountNumber: data.account_number || accountNumber,
        accountName: data.account_name,
      };
    } catch (err: any) {
      console.error(
        "❌ Paystack Bank Resolve Error:",
        err.response?.data || err.message
      );
      throw new Error(
        err.response?.data?.message ||
          "Could not verify bank account. Check bank and account number."
      );
    }
  }

  /**
   * Fetch live spendable NGN balance in Paystack (in Naira).
   * Used by the T+1 settlement scheduler so we never release/disburse before Paystack clears.
   */
  static async getNgnBalance(): Promise<number | null> {
    try {
      const response = await axios.get(`${PAYSTACK_BASE_URL}/balance`, {
        headers: getHeaders(),
        timeout: 15000,
      });
      const balances = response.data?.data;
      if (!response.data?.status || !Array.isArray(balances)) return null;
      const ngn = balances.find(
        (b: any) => String(b.currency || "").toUpperCase() === "NGN"
      );
      return ngn ? Number(ngn.balance || 0) / 100 : 0;
    } catch (err: any) {
      console.warn(
        "Paystack balance check failed:",
        err.response?.data?.message || err.message
      );
      return null;
    }
  }

  /**
   * Initiate a bank transfer payout to a merchant via Paystack Transfers API.
   */
  static async initiateTransfer(params: {
    amount: number;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    narration: string;
    reference?: string;
  }) {
    const headers = getHeaders();

    try {
      // 1. Create or retrieve transfer recipient
      const recipientRes = await axios.post(
        `${PAYSTACK_BASE_URL}/transferrecipient`,
        {
          type: "nuban",
          name: params.accountName,
          account_number: params.accountNumber,
          bank_code: params.bankCode,
          currency: "NGN",
        },
        { headers, timeout: 15000 }
      );

      const recipientCode = recipientRes.data?.data?.recipient_code;
      if (!recipientRes.data?.status || !recipientCode) {
        throw new Error(
          recipientRes.data?.message || "Failed to create Paystack transfer recipient"
        );
      }

      // 2. Execute transfer from Paystack Balance
      const transferRes = await axios.post(
        `${PAYSTACK_BASE_URL}/transfer`,
        {
          source: "balance",
          amount: Math.round(params.amount * 100),
          recipient: recipientCode,
          reason: params.narration,
          ...(params.reference ? { reference: params.reference } : {}),
        },
        { headers, timeout: 20000 }
      );

      if (!transferRes.data?.status) {
        throw new Error(
          transferRes.data?.message || "Paystack transfer failed"
        );
      }

      return transferRes.data;
    } catch (err: any) {
      console.error(
        "❌ Paystack Transfer Error:",
        err.response?.data || err.message
      );
      throw new Error(
        err.response?.data?.message || "Failed to process bank transfer payout"
      );
    }
  }
}
