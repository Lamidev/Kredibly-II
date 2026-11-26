import { ENV } from "../config/env";
import {
  NombaService,
  DynamicAccountResult,
  BankAccountResolveResult,
} from "./nomba.service";
import { PaystackService } from "./paystack.service";

export type PaymentProviderName = "paystack" | "nomba";

/**
 * Dynamic Payment Gateway Adapter.
 * Switch active payment partner with a single env var:
 *   PAYMENT_PROVIDER=paystack | nomba
 * Zero code changes needed when adding Bachs, Vode, or switching providers.
 */
export class PaymentGateway {
  static getActiveProvider(): PaymentProviderName {
    return ENV.PAYMENT_PROVIDER === "nomba" ? "nomba" : "paystack";
  }

  static hasPaystackCredentials(): boolean {
    return Boolean(ENV.PAYSTACK_SECRET_KEY);
  }

  static hasNombaCredentials(): boolean {
    return Boolean(
      ENV.NOMBA_CLIENT_ID && ENV.NOMBA_PRIVATE_KEY && ENV.NOMBA_ACCOUNT_ID
    );
  }

  static isConfigured(): boolean {
    const active = this.getActiveProvider();
    return active === "paystack"
      ? this.hasPaystackCredentials()
      : this.hasNombaCredentials();
  }

  static async createDynamicVirtualAccount(params: {
    amount: number;
    orderNumber: string;
    merchantName?: string;
    customerEmail?: string;
  }): Promise<DynamicAccountResult> {
    if (this.getActiveProvider() === "paystack") {
      return PaystackService.createDynamicVirtualAccount(params);
    }
    return NombaService.createDynamicVirtualAccount(params);
  }

  static async createCheckoutOrder(params: {
    amount: number;
    orderReference: string;
    customerEmail: string;
    customerName: string;
    callbackUrl: string;
    channels?: string[];
  }): Promise<string> {
    if (this.getActiveProvider() === "paystack") {
      return PaystackService.createCheckoutOrder(params);
    }
    return NombaService.createCheckoutOrder(params);
  }

  /**
   * Verifies payment against the active provider first, and transparently checks
   * the secondary provider if configured (so in-flight orders settle smoothly during switches).
   */
  static async verifyPayment(
    reference: string,
    expectedAmount: number
  ): Promise<boolean> {
    const active = this.getActiveProvider();

    if (active === "paystack") {
      if (this.hasPaystackCredentials()) {
        const paid = await PaystackService.verifyPayment(
          reference,
          expectedAmount
        );
        if (paid) return true;
      }
      if (this.hasNombaCredentials()) {
        return NombaService.verifyVirtualAccountPayment(
          reference,
          expectedAmount
        );
      }
      return false;
    }

    if (this.hasNombaCredentials()) {
      const paid = await NombaService.verifyVirtualAccountPayment(
        reference,
        expectedAmount
      );
      if (paid) return true;
    }
    if (this.hasPaystackCredentials()) {
      return PaystackService.verifyPayment(reference, expectedAmount);
    }
    return false;
  }

  static async resolveAccount(
    accountNumber: string,
    bankCode: string
  ): Promise<BankAccountResolveResult> {
    if (this.getActiveProvider() === "paystack") {
      return PaystackService.resolveAccount(accountNumber, bankCode);
    }
    return NombaService.resolveAccount(accountNumber, bankCode);
  }

  static async initiateTransfer(params: {
    amount: number;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    narration: string;
    reference?: string;
  }) {
    if (this.getActiveProvider() === "paystack") {
      return PaystackService.initiateTransfer(params);
    }
    return NombaService.initiateTransfer(params);
  }

  /**
   * Gateway processing fee estimate for a given NGN amount:
   * - Paystack: 1.5% (< ₦2,500), or 1.5% + ₦100 capped at ₦2,000 (>= ₦2,500)
   * - Nomba DVA: 1% min ₦10, max ₦150
   */
  static calculateGatewayFee(amount: number): number {
    if (this.getActiveProvider() === "paystack") {
      if (amount < 2500) {
        return Math.round(amount * 0.015 * 100) / 100;
      }
      return Math.min(2000, Math.round((amount * 0.015 + 100) * 100) / 100);
    }
    return Math.max(10, Math.min(150, Math.round(amount * 0.01 * 100) / 100));
  }

  static async getAvailableGatewayBalance(): Promise<number | null> {
    if (this.getActiveProvider() === "paystack" && this.hasPaystackCredentials()) {
      return PaystackService.getNgnBalance();
    }
    return null;
  }
}
