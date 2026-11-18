import axios from "axios";
import https from "https";
import http from "http";
import crypto from "crypto";
import { ENV } from "../config/env";

// Force IPv4 to comply with Nomba IP whitelisting
const ipv4HttpsAgent = new https.Agent({ family: 4 });
const ipv4HttpAgent = new http.Agent({ family: 4 });

const NOMBA_BASE_URL = "https://api.nomba.com/v1";

interface TokenCache {
  token: string | null;
  expiresAt: number | null;
}

const tokenCache: TokenCache = {
  token: null,
  expiresAt: null,
};

export interface DynamicAccountResult {
  accountNumber: string;
  bankName: string;
  accountName: string;
  reference: string;
  expiresAt: string;
}

export interface BankAccountResolveResult {
  accountNumber: string;
  accountName: string;
}

export class NombaService {
  /**
   * Nomba OAuth2 Client Credentials - cached for ~1 hour
   */
  static async getAccessToken(retryCount = 0): Promise<string> {
    const now = Date.now();

    if (tokenCache.token && tokenCache.expiresAt && now < tokenCache.expiresAt - 60000) {
      return tokenCache.token;
    }

    if (!ENV.NOMBA_CLIENT_ID || !ENV.NOMBA_PRIVATE_KEY || !ENV.NOMBA_ACCOUNT_ID) {
      throw new Error("Nomba credentials missing in environment configuration");
    }

    try {
      const response = await axios.post(
        `${NOMBA_BASE_URL}/auth/token/issue/`,
        {
          grant_type: "client_credentials",
          client_id: ENV.NOMBA_CLIENT_ID,
          client_secret: ENV.NOMBA_PRIVATE_KEY,
        },
        {
          headers: {
            "Content-Type": "application/json",
            accountId: ENV.NOMBA_ACCOUNT_ID,
          },
          timeout: 15000,
          httpsAgent: ipv4HttpsAgent,
          httpAgent: ipv4HttpAgent,
        }
      );

      const tokenData = response.data?.data;
      const accessToken = tokenData?.access_token;
      const expiresAt = tokenData?.expiresAt;

      if (!accessToken) {
        throw new Error("Nomba auth response missing access_token");
      }

      tokenCache.token = accessToken;
      tokenCache.expiresAt = expiresAt ? new Date(expiresAt).getTime() : now + 3600 * 1000;

      console.log("🟢 Nomba: Access token refreshed successfully");
      return accessToken;
    } catch (err: any) {
      console.error(`❌ Nomba Token Error (Attempt ${retryCount + 1}):`, err.response?.data || err.message);

      if (retryCount < 1) {
        console.log("🔄 Retrying Nomba authentication...");
        return this.getAccessToken(retryCount + 1);
      }

      throw new Error("Failed to authenticate with Nomba. Check credentials.");
    }
  }

  /**
   * Create a Dynamic Virtual Account (DVA) for an order
   * Buyer transfers directly to this unique bank account to pay for their order
   */
  static async createDynamicVirtualAccount(params: {
    amount: number;
    orderNumber: string;
    merchantName?: string;
    customerEmail?: string;
  }): Promise<DynamicAccountResult> {
    const token = await this.getAccessToken();

    const cleanOrderNumber = params.orderNumber.replace(/[^a-zA-Z0-9]/g, "");
    const reference = `KRD-${cleanOrderNumber}-${Date.now().toString().slice(-6)}`;
    const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const rawMerchant = (params.merchantName || "KREDIBLY")
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, "")
      .trim();

    const accountName = rawMerchant.substring(0, 30);

    const payload = {
      accountRef: reference,
      accountName,
      bvn: "",
      expiryDate,
      customerEmail: params.customerEmail || "orders@usekredibly.com",
      amount: Math.round(params.amount * 100), // In kobo
    };

    try {
      const response = await axios.post(`${NOMBA_BASE_URL}/accounts/virtual`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          accountId: ENV.NOMBA_ACCOUNT_ID,
        },
        timeout: 15000,
        httpsAgent: ipv4HttpsAgent,
        httpAgent: ipv4HttpAgent,
      });

      const data = response.data?.data;
      const bankAccNo = data?.bankAccountNumber || data?.accountNumber;
      const bankAccName = data?.bankAccountName || data?.accountName;

      if (!data || !bankAccNo) {
        throw new Error(response.data?.message || "Nomba did not return a valid virtual account");
      }

      console.log(`✅ Nomba DVA created: ${bankAccNo} for Order ${params.orderNumber}`);

      return {
        accountNumber: bankAccNo,
        bankName: data.bankName || "Nombank MFB",
        accountName: bankAccName || `Kredibly - ${params.orderNumber}`,
        reference,
        expiresAt: expiryDate,
      };
    } catch (err: any) {
      console.error("❌ Nomba DVA Creation Error:", err.response?.data || err.message);
      throw new Error(err.response?.data?.message || "Failed to create virtual account");
    }
  }

  /**
   * Hosted Nomba Checkout link
   */
  static async createCheckoutOrder(params: {
    amount: number;
    orderReference: string;
    customerEmail: string;
    customerName?: string;
    callbackUrl?: string;
  }): Promise<string> {
    const token = await this.getAccessToken();

    const payload = {
      order: {
        orderReference: params.orderReference,
        currency: "NGN",
        amount: params.amount.toFixed(2),
        customerEmail: params.customerEmail,
        customerName: params.customerName || "Kredibly Customer",
        callbackUrl: params.callbackUrl || `${ENV.FRONTEND_URL}/order/confirmation`,
      },
    };

    try {
      const response = await axios.post(`${NOMBA_BASE_URL}/checkout/order`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          accountId: ENV.NOMBA_ACCOUNT_ID,
        },
        timeout: 15000,
        httpsAgent: ipv4HttpsAgent,
        httpAgent: ipv4HttpAgent,
      });

      const checkoutLink = response.data?.data?.checkoutLink;
      if (!checkoutLink) {
        throw new Error("Nomba did not return a valid checkout link");
      }

      return checkoutLink;
    } catch (err: any) {
      console.error("❌ Nomba Checkout Error:", err.response?.data || err.message);
      throw new Error(err.response?.data?.message || "Failed to initialize Nomba checkout");
    }
  }

  /**
   * Resolve and verify Nigerian bank account details
   */
  static async resolveAccount(accountNumber: string, bankCode: string): Promise<BankAccountResolveResult> {
    const token = await this.getAccessToken();

    try {
      const response = await axios.post(
        `${NOMBA_BASE_URL}/transfers/bank/lookup`,
        {
          accountNumber,
          bankCode: this.mapBankCode(bankCode),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            accountId: ENV.NOMBA_ACCOUNT_ID,
          },
          timeout: 15000,
          httpsAgent: ipv4HttpsAgent,
          httpAgent: ipv4HttpAgent,
        }
      );

      const data = response.data?.data;
      if (!data || !data.accountName) {
        throw new Error("Could not resolve account name");
      }

      return {
        accountNumber,
        accountName: data.accountName,
      };
    } catch (err: any) {
      throw new Error(err.response?.data?.description || err.response?.data?.message || "Failed to verify account");
    }
  }

  /**
   * Payout / Transfer money to merchant's bank account
   */
  static async initiateTransfer(params: {
    amount: number;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    narration?: string;
  }) {
    const token = await this.getAccessToken();
    const bankCode = this.mapBankCode(params.bankCode);

    try {
      const response = await axios.post(
        "https://api.nomba.com/v2/transfers/bank",
        {
          amount: Number(params.amount).toFixed(2),
          bankCode,
          accountNumber: params.accountNumber,
          accountName: params.accountName,
          narration: String(params.narration || "Kredibly Settlement").substring(0, 25).toUpperCase(),
          senderName: "KREDIBLY",
          feeBearer: "ACCOUNT",
          merchantTxRef: `KREDSWEEP_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            accountId: ENV.NOMBA_ACCOUNT_ID,
          },
          timeout: 15000,
          httpsAgent: ipv4HttpsAgent,
          httpAgent: ipv4HttpAgent,
        }
      );

      return response.data;
    } catch (err: any) {
      console.error("❌ Nomba Transfer Error:", err.response?.data || err.message);
      throw new Error(err.response?.data?.description || err.response?.data?.message || "Transfer failed");
    }
  }

  /**
   * Verify Nomba webhook signature
   */
  static verifyWebhookSignature(signature: string, rawBody: string | Buffer): boolean {
    try {
      const payload = Buffer.isBuffer(rawBody) ? rawBody : String(rawBody);
      const secrets = [ENV.NOMBA_WEBHOOK_SECRET, ENV.NOMBA_PRIVATE_KEY].filter(Boolean);

      for (const secret of secrets) {
        const candidates = [
          crypto.createHmac("sha512", secret).update(payload).digest("base64"),
          crypto.createHmac("sha512", secret).update(payload).digest("hex"),
          crypto.createHmac("sha256", secret).update(payload).digest("base64"),
          crypto.createHmac("sha256", secret).update(payload).digest("hex"),
        ];

        const sigBuf = Buffer.from(signature, "utf8");
        for (const expected of candidates) {
          const expectedBuf = Buffer.from(expected, "utf8");
          if (
            expectedBuf.length === sigBuf.length &&
            crypto.timingSafeEqual(expectedBuf, sigBuf)
          ) {
            return true;
          }
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  private static mapBankCode(code: string): string {
    const mapping: Record<string, string> = {
      "999992": "305",
      "999991": "302",
      "50515": "090405",
      "50211": "090267",
      "100004": "305",
    };
    return mapping[code] || code;
  }
}
