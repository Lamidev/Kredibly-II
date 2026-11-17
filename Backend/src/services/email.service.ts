import { Resend } from "resend";
import { ENV } from "../config/env";

const resend = ENV.RESEND_API_KEY ? new Resend(ENV.RESEND_API_KEY) : null;

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export class EmailService {
  /**
   * Generic sender wrapper with error catching so emails never crash critical business transactions
   */
  static async send(options: SendEmailOptions): Promise<boolean> {
    if (!resend || !ENV.RESEND_API_KEY) {
      console.warn("⚠️ RESEND_API_KEY is not configured. Email skipped:", {
        to: options.to,
        subject: options.subject,
      });
      return false;
    }

    try {
      const response = await resend.emails.send({
        from: `Kredibly <${ENV.SENDER_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo || ENV.ADMIN_EMAIL,
      });

      if (response.error) {
        console.error("❌ Resend error:", response.error);
        return false;
      }

      console.log(`📧 Email sent successfully to ${options.to} (ID: ${response.data?.id})`);
      return true;
    } catch (error) {
      console.error("❌ Failed to send email via Resend:", error);
      return false;
    }
  }

  /**
   * Send welcome email when a new merchant registers and sets up their store
   */
  static async sendWelcomeEmail(data: {
    to: string;
    fullName: string;
    storeName: string;
    storeSlug: string;
  }) {
    const storeUrl = `${ENV.FRONTEND_URL}/${data.storeSlug}`;
    const dashboardUrl = `${ENV.FRONTEND_URL}/dashboard`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 28px;">
          <h1 style="color: #0f172a; margin: 0; font-size: 26px; font-weight: 800;">Welcome to Kredibly 🚀</h1>
          <p style="color: #64748b; font-size: 15px; margin-top: 6px;">Your store is officially live!</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 12px 0; font-size: 16px;">Hi <strong>${data.fullName}</strong>,</p>
          <p style="margin: 0 0 16px 0; line-height: 1.6; color: #334155;">
            Congratulations on creating <strong>${data.storeName}</strong>! Your storefront is ready to accept orders and receive payments safely.
          </p>
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;">
            <p style="margin: 0; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 600;">Your Store Link</p>
            <a href="${storeUrl}" style="color: #2563eb; font-size: 16px; font-weight: 600; text-decoration: none;" target="_blank">${storeUrl}</a>
          </div>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${dashboardUrl}" style="background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block;">
            Go to Your Dashboard →
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} Kredibly. Building trust for social commerce.
        </p>
      </div>
    `;

    return this.send({
      to: data.to,
      subject: `🎉 Your store "${data.storeName}" is live on Kredibly!`,
      html,
    });
  }

  /**
   * Send order confirmation receipt to the customer
   */
  static async sendOrderReceiptToCustomer(data: {
    to: string;
    customerName: string;
    orderNumber: string;
    storeName: string;
    totalAmount: string | number;
    itemsSummary: string;
  }) {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <h2 style="color: #0f172a; margin-top: 0;">Order Confirmed! 🛍️</h2>
        <p>Hi <strong>${data.customerName}</strong>,</p>
        <p>Your payment for order <strong>#${data.orderNumber}</strong> from <strong>${data.storeName}</strong> has been successfully received.</p>
        
        <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Order:</strong> #${data.orderNumber}</p>
          <p style="margin: 0 0 8px 0;"><strong>Total Paid:</strong> ₦${Number(data.totalAmount).toLocaleString()}</p>
          <p style="margin: 0;"><strong>Items:</strong> ${data.itemsSummary}</p>
        </div>

        <p style="font-size: 13px; color: #64748b;">
          🔒 <em>This transaction is backed by the Kredibly Escrow Guarantee. The seller has been notified to prepare your delivery.</em>
        </p>
      </div>
    `;

    return this.send({
      to: data.to,
      subject: `Order Confirmation #${data.orderNumber} - ${data.storeName}`,
      html,
    });
  }

  /**
   * Send instant sale alert to the merchant
   */
  static async sendNewSaleAlertToMerchant(data: {
    to: string;
    merchantName: string;
    storeName: string;
    orderNumber: string;
    customerName: string;
    totalAmount: string | number;
  }) {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <h2 style="color: #16a34a; margin-top: 0;">🎉 You just made a new sale!</h2>
        <p>Hi <strong>${data.merchantName}</strong>,</p>
        <p>A customer has just placed an order on your store <strong>${data.storeName}</strong>.</p>
        
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Order Number:</strong> #${data.orderNumber}</p>
          <p style="margin: 0 0 8px 0;"><strong>Customer:</strong> ${data.customerName}</p>
          <p style="margin: 0;"><strong>Amount:</strong> ₦${Number(data.totalAmount).toLocaleString()}</p>
        </div>

        <p>Log in to your Kredibly dashboard to view customer delivery details and fulfill the order.</p>
      </div>
    `;

    return this.send({
      to: data.to,
      subject: `💰 New Order #${data.orderNumber} received for ${data.storeName}!`,
      html,
    });
  }

  /**
   * Send password reset link to merchant
   */
  static async sendPasswordResetEmail(data: {
    to: string;
    fullName: string;
    resetToken: string;
  }) {
    const resetUrl = `${ENV.FRONTEND_URL}/reset-password?token=${data.resetToken}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 800;">Reset Your Password</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 6px;">We received a request to reset your Kredibly password.</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 12px 0; font-size: 15px;">Hi <strong>${data.fullName}</strong>,</p>
          <p style="margin: 0 0 16px 0; line-height: 1.6; color: #334155;">
            Click the button below to choose a new password for your merchant account. This link will expire in <strong>1 hour</strong>.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #2e1065; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
            If you didn't request this password reset, you can safely ignore this email—your password will remain unchanged.
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} Kredibly. Building trust for social commerce.
        </p>
      </div>
    `;

    return this.send({
      to: data.to,
      subject: "Reset your Kredibly password",
      html,
    });
  }

  /**
   * Send 6-digit OTP code to confirm a payout bank account change
   */
  static async sendBankChangeOtpEmail(data: {
    to: string;
    fullName: string;
    storeName: string;
    otp: string;
  }) {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0f172a; margin: 0; font-size: 22px; font-weight: 800;">Confirm Bank Account Change</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 6px;">Security verification for ${data.storeName}</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 12px 0; font-size: 15px;">Hi <strong>${data.fullName}</strong>,</p>
          <p style="margin: 0 0 16px 0; line-height: 1.6; color: #334155;">
            Use the confirmation code below to authorize changing your payout bank account on Kredibly. This code expires in <strong>10 minutes</strong>.
          </p>
          <div style="background: #ffffff; border: 1px dashed #3b0764; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #2e1065;">${data.otp}</span>
          </div>
          <p style="margin: 0; font-size: 12.5px; color: #b45309; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 12px;">
            ⚠️ <strong>24-Hour Security Lock:</strong> For your protection against fraud, withdrawals will be paused for 24 hours after changing your payout bank account.
          </p>
        </div>

        <p style="font-size: 12px; color: #64748b; text-align: center;">
          If you did not request this change, ignore this email and change your password immediately.
        </p>
      </div>
    `;

    return this.send({
      to: data.to,
      subject: `🔐 ${data.otp} is your Kredibly bank change confirmation code`,
      html,
    });
  }

  /**
   * Send security alert when payout bank account is changed
   */
  static async sendBankChangedAlertEmail(data: {
    to: string;
    fullName: string;
    storeName: string;
    bankName: string;
    accountNumber: string;
    lockedUntil: Date;
  }) {
    const maskedAcc = data.accountNumber.replace(/^(\d{2})\d{4}(\d{4})$/, "$1****$2");
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <h2 style="color: #0f172a; margin-top: 0;">Payout Bank Account Updated 🔒</h2>
        <p>Hi <strong>${data.fullName}</strong>,</p>
        <p>Your payout bank account for <strong>${data.storeName}</strong> was just updated to:</p>
        <div style="background-color: #f1f5f9; border-radius: 8px; padding: 14px 16px; margin: 16px 0;">
          <p style="margin: 0 0 6px 0;"><strong>Bank:</strong> ${data.bankName}</p>
          <p style="margin: 0;"><strong>Account Number:</strong> ${maskedAcc}</p>
        </div>
        <p style="font-size: 13.5px; color: #b45309;">
          For fraud protection, withdrawals are temporarily locked for 24 hours until <strong>${data.lockedUntil.toUTCString()}</strong>.
        </p>
        <p style="font-size: 12.5px; color: #64748b;">
          If you did not authorize this change, contact Kredibly support immediately at ${ENV.ADMIN_EMAIL}.
        </p>
      </div>
    `;

    return this.send({
      to: data.to,
      subject: `⚠️ Payout bank account changed for ${data.storeName}`,
      html,
    });
  }
}
