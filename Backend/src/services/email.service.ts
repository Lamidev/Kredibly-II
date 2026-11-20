import { Resend } from "resend";
import { ENV } from "../config/env";

const resend = ENV.RESEND_API_KEY ? new Resend(ENV.RESEND_API_KEY) : null;

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  fromName?: string;
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
      const safeFromName = (options.fromName || "Kredibly").replace(/[<>"]/g, "").trim() || "Kredibly";
      const response = await resend.emails.send({
        from: `${safeFromName} <${ENV.SENDER_EMAIL}>`,
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
   * Send 6-digit verification / confirmation / reset code for Storefront Shoppers
   */
  static async sendShopperCodeEmail(data: {
    to: string;
    fullName: string;
    storeName: string;
    code: string;
    purpose: "verify" | "reset" | "profile";
  }) {
    const titles = {
      verify: "Verify your email address",
      reset: "Reset your password",
      profile: "Confirm your profile update",
    };
    const descriptions = {
      verify: `Enter this 6-digit code to finish creating your ${data.storeName} account.`,
      reset: `Enter this 6-digit code to reset your ${data.storeName} password.`,
      profile: `Enter this 6-digit code to confirm changes to your ${data.storeName} profile.`,
    };

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #0f172a; background-color: #ffffff;">
        <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #2e1065;">${data.storeName}</p>
          <h1 style="color: #0f172a; margin: 8px 0 0 0; font-size: 22px; font-weight: 700;">${titles[data.purpose]}</h1>
        </div>
        <div style="background-color: #faf9f5; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 12px 0; font-size: 15px;">Hi <strong>${data.fullName}</strong>,</p>
          <p style="margin: 0 0 16px 0; line-height: 1.6; color: #334155; font-size: 14px;">${descriptions[data.purpose]}</p>
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; text-align: center;">
            <span style="font-family: monospace; font-size: 28px; font-weight: 800; letter-spacing: 0.25em; color: #2e1065;">${data.code}</span>
          </div>
          <p style="margin: 14px 0 0 0; font-size: 12px; color: #64748b;">
            This code expires in 15 minutes. If you did not request this, please ignore this email.
          </p>
        </div>
      </div>
    `;

    return this.send({
      to: data.to,
      subject: `${data.code} is your ${data.storeName} verification code`,
      html,
    });
  }

  /**
   * Send 6-digit email verification code on merchant signup
   */
  static async sendEmailVerificationCode(data: {
    to: string;
    fullName: string;
    code: string;
  }) {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #0f172a; background-color: #ffffff;">
        <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #2e1065;">Kredibly</p>
          <h1 style="color: #0f172a; margin: 8px 0 0 0; font-size: 22px; font-weight: 700;">Verify your email address</h1>
          <p style="color: #64748b; font-size: 14px; margin: 6px 0 0 0;">Enter the 6-digit code below to activate your merchant account.</p>
        </div>

        <div style="background-color: #faf9f5; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 12px 0; font-size: 15px;">Hi <strong>${data.fullName}</strong>,</p>
          <p style="margin: 0 0 16px 0; line-height: 1.6; color: #334155; font-size: 14px;">
            Use this verification code to confirm your email address and launch your Kredibly store:
          </p>
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; text-align: center;">
            <span style="font-family: monospace; font-size: 28px; font-weight: 800; letter-spacing: 0.25em; color: #2e1065;">${data.code}</span>
          </div>
          <p style="margin: 14px 0 0 0; font-size: 12px; color: #64748b;">
            This code expires in 15 minutes. If you did not create a Kredibly account, you can safely ignore this email.
          </p>
        </div>

        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
          Kredibly Technologies Ltd • Digital Storefront &amp; Escrow Platform
        </p>
      </div>
    `;

    return this.send({
      to: data.to,
      subject: `${data.code} is your Kredibly verification code`,
      html,
    });
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
    const storeUrl = `https://${data.storeSlug}.kredibly.shop`;
    const dashboardUrl = `${ENV.FRONTEND_URL}/dashboard`;
    const firstName = (data.fullName || "").trim().split(" ")[0] || "there";

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #0f172a; background-color: #ffffff;">
        <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #2e1065;">Kredibly</p>
          <h1 style="color: #0f172a; margin: 8px 0 0 0; font-size: 24px; font-weight: 800;">Welcome aboard, ${this.escapeHtml(firstName)}!</h1>
        </div>

        <div style="font-size: 14.5px; line-height: 1.7; color: #334155;">
          <p style="margin: 0 0 14px 0;">Hello ${this.escapeHtml(firstName)},</p>
          <p style="margin: 0 0 14px 0;">
            Welcome to <strong>Kredibly</strong>, and thank you for launching <strong>${this.escapeHtml(data.storeName)}</strong> with us.
          </p>
          <p style="margin: 0 0 14px 0;">
            I&apos;m truly excited to have you join our community of growing businesses that care about giving their customers a fast, trustworthy, and effortless way to shop online.
          </p>
          <p style="margin: 0 0 14px 0;">
            At Kredibly, we believe selling online shouldn&apos;t require hiring a developer, repeating prices in DMs all day, or chasing fake transfer screenshots. Our goal is to give your business a complete online store—with instant bank transfer verification, automated order tracking, and direct payouts—so you can focus on growing what matters most.
          </p>
          <p style="margin: 0 0 8px 0;">
            We will constantly improve ways to serve you, guided by one core question:
          </p>
          <p style="margin: 0 0 16px 0; padding: 12px 16px; background-color: #f7f4fc; border-left: 3px solid #2e1065; border-radius: 6px; font-weight: 700; color: #2e1065;">
            How can we make selling online easier and more profitable for your business?
          </p>
          <p style="margin: 0 0 14px 0;">
            I encourage you to explore your dashboard, customize your storefront, and reach out to our support team at <a href="mailto:support@usekredibly.com" style="color: #2e1065; font-weight: 600;">support@usekredibly.com</a> whenever you need help. We&apos;re here to partner with you, not just provide a tool.
          </p>
          <p style="margin: 0 0 18px 0;">
            Lastly, if you have any major feedback I should prioritize, feel free to email me directly at <a href="mailto:usekredibly@gmail.com" style="color: #2e1065; font-weight: 600;">usekredibly@gmail.com</a>. I would love to hear from you.
          </p>
        </div>

        <div style="background-color: #faf9f5; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700;">Your Live Store Link</p>
          <a href="${storeUrl}" style="color: #2e1065; font-size: 15px; font-weight: 700; text-decoration: none;" target="_blank">${storeUrl}</a>
        </div>

        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 12px 0; font-size: 12.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #2e1065;">Complete Your 5-Step Onboarding</p>
          <ol style="margin: 0; padding-left: 18px; color: #334155; font-size: 13.5px; line-height: 1.75;">
            <li><strong>Brand &amp; Hero:</strong> Upload your store logo, hero cover photo, and store bio in <em>Store Settings</em>.</li>
            <li><strong>Footer &amp; Contact:</strong> Add your support email, address, and social links (Instagram, TikTok) in <em>Store Settings</em>.</li>
            <li><strong>Exclusive Offer &amp; Delivery:</strong> Pin a custom offer banner at the top of your store and set delivery fees in <em>Delivery &amp; Offers</em>.</li>
            <li><strong>Add Your Products:</strong> Upload photos and publish your products in <em>Products</em>.</li>
            <li><strong>Link Bank &amp; Verify Identity (KYC):</strong> Link your Nigerian bank account and verify your NIN or BVN in <em>Wallet &amp; Payouts</em> to unlock instant withdrawals &amp; 8:00 AM Auto T+1 payouts.</li>
          </ol>
        </div>

        <div style="margin: 24px 0;">
          <a href="${dashboardUrl}" style="background-color: #2e1065; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; display: inline-block; margin-right: 10px; margin-bottom: 10px;">
            Sign in to your dashboard &rarr;
          </a>
          <a href="https://chat.whatsapp.com/EO5f7wrZKLiFEz1VkFsWZc" style="background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; text-decoration: none; padding: 11px 18px; border-radius: 8px; font-size: 13.5px; font-weight: 600; display: inline-block; margin-bottom: 10px;" target="_blank">
            Join Merchant WhatsApp Community &rarr;
          </a>
        </div>

        <div style="margin-top: 24px; font-size: 14px; color: #334155; line-height: 1.6;">
          <p style="margin: 0;">Warm regards,</p>
          <p style="margin: 4px 0 0 0; font-weight: 700; color: #0f172a;">Akinyemi Oluwaseun</p>
          <p style="margin: 0; font-size: 13px; color: #64748b;">Founder, Kredibly · Akinbyte Technologies Limited</p>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0 16px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">
          Kredibly • Online Storefronts &amp; Instant Checkout Made Simple
        </p>
      </div>
    `;

    const text = `Welcome aboard, ${firstName}!\n\nHello ${firstName},\n\nWelcome to Kredibly, and thank you for launching ${data.storeName} with us.\n\nAt Kredibly, we believe selling online shouldn't require hiring a developer, repeating prices in DMs, or chasing fake transfer screenshots. Your storefront is live at ${storeUrl}.\n\nComplete your 5-step onboarding in your dashboard (${dashboardUrl}):\n1. Upload logo, hero cover & bio (Store Settings)\n2. Add support email, address & social links (Store Settings)\n3. Set your Exclusive Offer banner & delivery fees (Delivery & Offers)\n4. Add your products (Products)\n5. Link payout bank & verify NIN/BVN KYC (Wallet & Payouts) to unlock instant withdrawals & 8:00 AM Auto T+1 payouts\n\nJoin the Kredibly Merchant WhatsApp Community: https://chat.whatsapp.com/EO5f7wrZKLiFEz1VkFsWZc\n\nIf you have any feedback, reply or email usekredibly@gmail.com.\n\nWarm regards,\nAkinyemi Oluwaseun\nFounder, Kredibly (Akinbyte Technologies Limited)`;

    return this.send({
      to: data.to,
      subject: `Welcome aboard, ${firstName} — ${data.storeName} is live on Kredibly`,
      html,
      text,
    });
  }

  /**
   * Send store-branded order confirmation receipt to the customer
   */
  static async sendOrderReceiptToCustomer(data: {
    to: string;
    customerName: string;
    orderNumber: string;
    storeName: string;
    storeSlug?: string;
    storeEmail?: string | null;
    totalAmount: string | number;
    subtotal?: number;
    shippingFee?: number;
    discountAmount?: number;
    deliveryAddress?: string;
    customerPhone?: string;
    items?: Array<{
      productTitle: string;
      variantName?: string | null;
      quantity: number;
      subtotal: number | string;
    }>;
    itemsSummary: string;
  }) {
    const orderUrl = data.storeSlug
      ? `https://${data.storeSlug}.kredibly.shop/orders/${data.orderNumber}`
      : "";

    const itemsRowsHtml =
      data.items && data.items.length > 0
        ? data.items
            .map(
              (item) => `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a;">
                    <strong>${this.escapeHtml(item.productTitle)}</strong>${
                      item.variantName ? ` <span style="color:#64748b;">(${this.escapeHtml(item.variantName)})</span>` : ""
                    }<br/>
                    <span style="font-size: 12px; color: #64748b;">Qty: ${item.quantity}</span>
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #0f172a; text-align: right;">
                    ₦${Number(item.subtotal).toLocaleString()}
                  </td>
                </tr>
              `
            )
            .join("")
        : `<tr><td colspan="2" style="padding: 8px 0; font-size: 13px; color: #0f172a;">${this.escapeHtml(data.itemsSummary)}</td></tr>`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px 20px; color: #0f172a; background-color: #ffffff;">
        <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #2e1065;">${this.escapeHtml(data.storeName)}</p>
          <h1 style="margin: 6px 0 0 0; font-size: 22px; font-weight: 800; color: #0f172a;">Order Confirmed</h1>
        </div>

        <p style="font-size: 14px; color: #334155; margin: 0 0 8px 0;">Hi <strong>${this.escapeHtml(data.customerName)}</strong>,</p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 18px 0;">
          Thank you for shopping with <strong>${this.escapeHtml(data.storeName)}</strong>! Your payment for order <strong>#${this.escapeHtml(data.orderNumber)}</strong> has been confirmed and the store is preparing your order.
        </p>

        <div style="background-color: #faf9f5; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 18px;">
          <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b;">Order Summary · #${this.escapeHtml(data.orderNumber)}</p>
          <table style="width: 100%; border-collapse: collapse;">
            ${itemsRowsHtml}
            ${
              data.shippingFee !== undefined
                ? `<tr><td style="padding: 8px 0 4px; font-size: 12.5px; color: #64748b;">Delivery Fee</td><td style="padding: 8px 0 4px; font-size: 12.5px; color: #0f172a; text-align: right;">${data.shippingFee === 0 ? "FREE" : `₦${Number(data.shippingFee).toLocaleString()}`}</td></tr>`
                : ""
            }
            ${
              data.discountAmount && data.discountAmount > 0
                ? `<tr><td style="padding: 4px 0; font-size: 12.5px; color: #059669;">Discount</td><td style="padding: 4px 0; font-size: 12.5px; color: #059669; text-align: right;">-₦${Number(data.discountAmount).toLocaleString()}</td></tr>`
                : ""
            }
            <tr>
              <td style="padding: 10px 0 0; font-size: 14px; font-weight: 700; color: #0f172a;">Total Paid</td>
              <td style="padding: 10px 0 0; font-size: 16px; font-weight: 800; color: #2e1065; text-align: right;">₦${Number(data.totalAmount).toLocaleString()}</td>
            </tr>
          </table>
        </div>

        ${
          data.deliveryAddress
            ? `<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; margin-bottom: 18px; font-size: 13px; color: #334155;">
                <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b;">Delivery Destination</p>
                <p style="margin: 0;">${this.escapeHtml(data.deliveryAddress)}${data.customerPhone ? ` · ${this.escapeHtml(data.customerPhone)}` : ""}</p>
              </div>`
            : ""
        }

        ${
          orderUrl
            ? `<div style="margin: 20px 0;">
                <a href="${orderUrl}" style="display: inline-block; background-color: #2e1065; color: #ffffff; text-decoration: none; padding: 11px 20px; border-radius: 8px; font-size: 13px; font-weight: 600;">
                  View Order #${this.escapeHtml(data.orderNumber)}
                </a>
              </div>`
            : ""
        }

        <p style="margin-top: 28px; padding-top: 14px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; text-align: center;">
          Powered by Kredibly
        </p>
      </div>
    `;

    const text = `Hi ${data.customerName},\n\nThank you for shopping with ${data.storeName}! Your payment for order #${data.orderNumber} has been confirmed.\n\nItems: ${data.itemsSummary}\nTotal Paid: NGN ${Number(data.totalAmount).toLocaleString()}${data.deliveryAddress ? `\nDelivery To: ${data.deliveryAddress}` : ""}${orderUrl ? `\nView Order: ${orderUrl}` : ""}\n\nPowered by Kredibly`;

    return this.send({
      to: data.to,
      fromName: data.storeName,
      replyTo: data.storeEmail || undefined,
      subject: `Order Confirmed #${data.orderNumber} — ${data.storeName}`,
      html,
      text,
    });
  }

  /**
   * Send store-branded order status update email to buyer (Dispatched, Delivered, Cancelled)
   */
  static async sendOrderStatusUpdateEmail(data: {
    to: string;
    customerName: string;
    orderNumber: string;
    storeName: string;
    storeSlug: string;
    status: "SHIPPED" | "DELIVERED" | "CANCELLED";
  }) {
    const orderUrl = `https://${data.storeSlug}.kredibly.shop/orders/${data.orderNumber}`;
    const copy = {
      SHIPPED: {
        title: "Your Order Has Been Dispatched",
        body: `Great news! <strong>${this.escapeHtml(data.storeName)}</strong> has dispatched your order <strong>#${this.escapeHtml(data.orderNumber)}</strong> and it is on its way to you.`,
        note: "You can track your order details anytime using the button below.",
      },
      DELIVERED: {
        title: "Your Order Has Been Delivered",
        body: `Your order <strong>#${this.escapeHtml(data.orderNumber)}</strong> from <strong>${this.escapeHtml(data.storeName)}</strong> has been marked as delivered. Thank you for shopping with us!`,
        note: "If anything is missing or damaged, please contact the store within 24 hours with your order number.",
      },
      CANCELLED: {
        title: "Order Cancelled",
        body: `Your order <strong>#${this.escapeHtml(data.orderNumber)}</strong> from <strong>${this.escapeHtml(data.storeName)}</strong> has been cancelled. Please reach out to the store if you have any questions regarding your order or refund.`,
        note: "If you already paid, please contact the store directly with your order number to coordinate your refund.",
      },
    }[data.status];

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px 20px; color: #0f172a; background-color: #ffffff;">
        <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #2e1065;">${this.escapeHtml(data.storeName)}</p>
          <h1 style="margin: 6px 0 0 0; font-size: 20px; font-weight: 800; color: #0f172a;">${copy.title}</h1>
        </div>
        <div style="background-color: #faf9f5; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 18px;">
          <p style="margin: 0 0 10px 0; font-size: 14px;">Hi <strong>${this.escapeHtml(data.customerName)}</strong>,</p>
          <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.6; color: #334155;">${copy.body}</p>
          <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.5; color: #64748b;">${copy.note}</p>
          <a href="${orderUrl}" style="display: inline-block; background-color: #2e1065; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 600;">
            View Order #${this.escapeHtml(data.orderNumber)}
          </a>
        </div>
        <p style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; text-align: center;">
          Powered by Kredibly
        </p>
      </div>
    `;

    return this.send({
      to: data.to,
      fromName: data.storeName,
      subject: `${copy.title} — Order #${data.orderNumber} (${data.storeName})`,
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
    customerPhone?: string;
    deliveryAddress?: string;
    itemsSummary?: string;
    totalAmount: string | number;
    netAmount?: number;
  }) {
    const ordersUrl = `${ENV.FRONTEND_URL}/dashboard/orders`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px 20px; color: #0f172a; background-color: #ffffff;">
        <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #2e1065;">New Sale Notification</p>
        <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 22px; font-weight: 800;">New Paid Order #${this.escapeHtml(data.orderNumber)}</h2>
        <p style="font-size: 14px; color: #334155;">Hi <strong>${this.escapeHtml(data.merchantName)}</strong>,</p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">A customer has just placed and paid for an order on <strong>${this.escapeHtml(data.storeName)}</strong>.</p>
        
        <div style="background-color: #faf9f5; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 20px 0; font-size: 13.5px; line-height: 1.7;">
          <p style="margin: 0;"><strong>Order Number:</strong> #${this.escapeHtml(data.orderNumber)}</p>
          <p style="margin: 0;"><strong>Customer:</strong> ${this.escapeHtml(data.customerName)}${data.customerPhone ? ` (${this.escapeHtml(data.customerPhone)})` : ""}</p>
          ${data.itemsSummary ? `<p style="margin: 0;"><strong>Items:</strong> ${this.escapeHtml(data.itemsSummary)}</p>` : ""}
          ${data.deliveryAddress ? `<p style="margin: 0;"><strong>Delivery To:</strong> ${this.escapeHtml(data.deliveryAddress)}</p>` : ""}
          <p style="margin: 6px 0 0;"><strong>Total Paid:</strong> ₦${Number(data.totalAmount).toLocaleString()}</p>
          ${data.netAmount !== undefined ? `<p style="margin: 0; color: #059669;"><strong>Net Credited to Wallet:</strong> ₦${Number(data.netAmount).toLocaleString()}</p>` : ""}
        </div>

        <a href="${ordersUrl}" style="display: inline-block; background-color: #2e1065; color: #ffffff; text-decoration: none; padding: 11px 20px; border-radius: 8px; font-size: 13px; font-weight: 600;">
          View &amp; Fulfill Order →
        </a>
      </div>
    `;

    const text = `Hi ${data.merchantName},\n\nYou just received a new paid order on ${data.storeName}.\n\nOrder Number: #${data.orderNumber}\nCustomer: ${data.customerName}${data.customerPhone ? ` (${data.customerPhone})` : ""}${data.itemsSummary ? `\nItems: ${data.itemsSummary}` : ""}${data.deliveryAddress ? `\nDelivery: ${data.deliveryAddress}` : ""}\nTotal Paid: NGN ${Number(data.totalAmount).toLocaleString()}${data.netAmount !== undefined ? `\nNet Wallet Credit: NGN ${Number(data.netAmount).toLocaleString()}` : ""}\n\nFulfill Order: ${ordersUrl}`;

    return this.send({
      to: data.to,
      subject: `New Paid Order #${data.orderNumber} — ${data.storeName}`,
      html,
      text,
    });
  }

  /**
   * Notify Kredibly internal team when a new store is created & verified
   */
  static async sendNewStoreAlertToAdmin(data: {
    storeName: string;
    storeSlug: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone?: string | null;
  }) {
    const storeUrl = `https://${data.storeSlug}.kredibly.shop`;
    const adminStoresUrl = `${ENV.FRONTEND_URL}/admin/stores`;
    const recipients = Array.from(new Set([ENV.ADMIN_EMAIL, "usekredibly@gmail.com"].filter(Boolean)));
    const launchedAt = new Date().toLocaleString("en-NG", {
      timeZone: "Africa/Lagos",
      dateStyle: "medium",
      timeStyle: "short",
    });
    const cleanPhone = (data.ownerPhone || "").replace(/[^0-9]/g, "");
    const waDigits = cleanPhone.startsWith("0") ? `234${cleanPhone.slice(1)}` : cleanPhone;
    const ownerFirstName = (data.ownerName || "").trim().split(" ")[0] || "there";
    const waText = encodeURIComponent(
      `Hi ${ownerFirstName}, welcome to Kredibly! Congrats on launching ${data.storeName} (${storeUrl}). Need any help setting up your products, logo, or payouts?`
    );
    const waUrl = waDigits ? `https://wa.me/${waDigits}?text=${waText}` : "";

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 12px;">
        <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #2e1065;">New Store Alert</p>
        <h2 style="margin: 0 0 14px; font-size: 20px;">${this.escapeHtml(data.storeName)} just launched!</h2>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; font-size: 13.5px; line-height: 1.7;">
          <p style="margin: 0;"><strong>Store Name:</strong> ${this.escapeHtml(data.storeName)}</p>
          <p style="margin: 0;"><strong>Store URL:</strong> <a href="${storeUrl}">${storeUrl}</a></p>
          <p style="margin: 0;"><strong>Owner:</strong> ${this.escapeHtml(data.ownerName)}</p>
          <p style="margin: 0;"><strong>Email:</strong> ${this.escapeHtml(data.ownerEmail)}</p>
          ${data.ownerPhone ? `<p style="margin: 0;"><strong>Phone:</strong> ${this.escapeHtml(data.ownerPhone)}</p>` : ""}
          <p style="margin: 0;"><strong>Launched:</strong> ${launchedAt} WAT</p>
        </div>
        <div style="margin-top: 16px;">
          <a href="${adminStoresUrl}" style="display: inline-block; background: #2e1065; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; margin-right: 8px;">View in Admin &rarr;</a>
          ${waUrl ? `<a href="${waUrl}" style="display: inline-block; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; text-decoration: none; padding: 9px 14px; border-radius: 8px; font-size: 13px; font-weight: 600;">Chat Owner on WhatsApp</a>` : ""}
        </div>
      </div>
    `;

    return this.send({
      to: recipients,
      subject: `New Kredibly Store Created: ${data.storeName} (${data.storeSlug}.kredibly.shop)`,
      html,
      text: `New store created on Kredibly:\nStore: ${data.storeName} (${storeUrl})\nOwner: ${data.ownerName}\nEmail: ${data.ownerEmail}${data.ownerPhone ? `\nPhone: ${data.ownerPhone}` : ""}`,
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

    const text = `Hi ${data.fullName},\n\nWe received a request to reset your Kredibly password. Open the link below to set a new password (expires in 1 hour):\n\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.`;

    return this.send({
      to: data.to,
      subject: "Reset your Kredibly password",
      html,
      text,
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
          <p style="margin: 0; font-size: 12.5px; color: #92400e; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 12px;">
            <strong>24-Hour Security Lock:</strong> For your protection against fraud, withdrawals will be paused for 24 hours after changing your payout bank account.
          </p>
        </div>

        <p style="font-size: 12px; color: #64748b; text-align: center;">
          If you did not request this change, ignore this email and change your password immediately.
        </p>
      </div>
    `;

    const text = `Hi ${data.fullName},\n\nYour confirmation code to change the payout bank account for ${data.storeName} is: ${data.otp}\n\nThis code expires in 10 minutes. Note: Changing your bank account pauses withdrawals for 24 hours for your protection.`;

    return this.send({
      to: data.to,
      subject: `${data.otp} is your Kredibly bank change confirmation code`,
      html,
      text,
    });
  }

  /**
   * Send 6-digit OTP code to confirm a wallet withdrawal
   */
  static async sendWithdrawalOtpEmail(data: {
    to: string;
    fullName: string;
    storeName: string;
    amount: number;
    bankName: string;
    accountNumber: string;
    otp: string;
  }) {
    const maskedAcc = data.accountNumber.replace(/^(\d{2})\d{4}(\d{4})$/, "$1****$2");
    const formattedAmount = `₦${Math.round(data.amount).toLocaleString("en-NG")}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0f172a; margin: 0; font-size: 22px; font-weight: 800;">Confirm Wallet Withdrawal</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 6px;">Security verification for ${data.storeName}</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 12px 0; font-size: 15px;">Hi <strong>${data.fullName}</strong>,</p>
          <p style="margin: 0 0 14px 0; line-height: 1.6; color: #334155;">
            Enter the 6-digit confirmation code below to authorize withdrawing <strong>${formattedAmount}</strong> to <strong>${data.bankName} (${maskedAcc})</strong>. This code expires in <strong>10 minutes</strong>.
          </p>
          <div style="background: #ffffff; border: 1px dashed #3b0764; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #2e1065;">${data.otp}</span>
          </div>
        </div>

        <p style="font-size: 12px; color: #64748b; text-align: center;">
          If you did not request this withdrawal, ignore this email and change your password immediately.
        </p>
      </div>
    `;

    const text = `Hi ${data.fullName},\n\nYour confirmation code to withdraw ${formattedAmount} from ${data.storeName} to ${data.bankName} (${maskedAcc}) is: ${data.otp}\n\nThis code expires in 10 minutes.`;

    return this.send({
      to: data.to,
      subject: `${data.otp} is your Kredibly withdrawal confirmation code`,
      html,
      text,
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
        <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">Payout Bank Account Updated</h2>
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

    const text = `Hi ${data.fullName},\n\nYour payout bank account for ${data.storeName} was updated to ${data.bankName} (${maskedAcc}).\n\nFor security, withdrawals are paused for 24 hours until ${data.lockedUntil.toUTCString()}.\n\nIf you did not authorize this change, contact ${ENV.ADMIN_EMAIL} immediately.`;

    return this.send({
      to: data.to,
      subject: `Security notice: Payout bank account updated for ${data.storeName}`,
      html,
      text,
    });
  }

  static escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Notify merchant when their automated T+1 daily settlement is dispatched
   */
  static async sendAutoSettlementEmail(data: {
    to: string;
    fullName: string;
    storeName: string;
    amount: number;
    bankName: string;
    accountNumber: string;
    reference: string;
  }) {
    const maskedAcc = `******${data.accountNumber.slice(-4)}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #2e1065; margin-top: 0;">Daily T+1 Settlement Sent</h2>
        <p style="font-size: 14px; line-height: 1.6;">Hi ${this.escapeHtml(data.fullName)},</p>
        <p style="font-size: 14px; line-height: 1.6;">
          Your automated T+1 payout for <strong>${this.escapeHtml(data.storeName)}</strong> has been dispatched to your linked bank account:
        </p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 6px; font-size: 22px; font-weight: 800; color: #2e1065;">₦${data.amount.toLocaleString()}</p>
          <p style="margin: 0; font-size: 13px; color: #475569;">${this.escapeHtml(data.bankName)} · ${maskedAcc}</p>
          <p style="margin: 6px 0 0; font-size: 11px; color: #64748b; font-family: monospace;">Ref: ${this.escapeHtml(data.reference)}</p>
        </div>
        <p style="font-size: 12.5px; color: #64748b; line-height: 1.5;">
          Need funds sooner next time? You can always trigger an instant withdrawal from your Kredibly Wallet whenever your balance is ₦1,000 or more.
        </p>
      </div>
    `;

    const text = `Hi ${data.fullName},\n\nYour automated T+1 payout of ₦${data.amount.toLocaleString()} for ${data.storeName} has been sent to ${data.bankName} (${maskedAcc}).\nReference: ${data.reference}`;

    return this.send({
      to: data.to,
      subject: `₦${data.amount.toLocaleString()} T+1 Settlement Sent — ${data.storeName}`,
      html,
      text,
    });
  }

  /**
   * Forward Custom Website / E-commerce Inquiry to Akinyemioluwaseunjunior@gmail.com
   * and send a creative confirmation email back to the requester.
   */
  static async sendCustomBuildInquiryEmail(data: {
    name: string;
    phone: string;
    email: string;
    projectType: string;
    budget?: string;
    timeline: string;
    details?: string;
  }) {
    const adminHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 12px;">
        <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #2e1065; margin: 0 0 8px;">New Custom Build Inquiry</p>
        <h2 style="margin: 0 0 16px; color: #0f172a;">${this.escapeHtml(data.projectType)} — ${this.escapeHtml(data.name)}</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
          <tr><td style="padding: 6px 0; color: #64748b; width: 130px;"><strong>Name</strong></td><td style="padding: 6px 0;">${this.escapeHtml(data.name)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Phone</strong></td><td style="padding: 6px 0;">${this.escapeHtml(data.phone)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Email</strong></td><td style="padding: 6px 0;"><a href="mailto:${this.escapeHtml(data.email)}">${this.escapeHtml(data.email)}</a></td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Project Type</strong></td><td style="padding: 6px 0;">${this.escapeHtml(data.projectType)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Budget</strong></td><td style="padding: 6px 0;">${this.escapeHtml(data.budget || "Not specified")}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Timeline</strong></td><td style="padding: 6px 0;">${this.escapeHtml(data.timeline)}</td></tr>
        </table>
        <div style="margin-top: 16px; padding: 14px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; color: #475569;">Project Details</p>
          <p style="margin: 0; font-size: 13.5px; line-height: 1.6; white-space: pre-wrap;">${this.escapeHtml(data.details || "No additional details provided.")}</p>
        </div>
      </div>
    `;

    const clientHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 14px;">
        <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #2e1065; margin: 0 0 8px;">Akinbyte Technologies Limited</p>
        <h2 style="margin: 0 0 12px; color: #0f172a; font-size: 22px;">We&apos;ve got your brief, ${this.escapeHtml(data.name)}!</h2>
        <p style="font-size: 14px; line-height: 1.65; color: #334155;">
          Thank you for reaching out about your <strong>${this.escapeHtml(data.projectType)}</strong>. Our engineering &amp; product team has received your project details and will review everything carefully.
        </p>
        <div style="background: #f7f4fc; border: 1px solid #e9d5ff; border-radius: 10px; padding: 16px; margin: 18px 0;">
          <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; color: #2e1065;">What happens next</p>
          <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #334155; line-height: 1.7;">
            <li>We review your goals, timeline (${this.escapeHtml(data.timeline)}), and technical scope.</li>
            <li>A lead builder from our team will reply directly to this email within <strong>24 hours</strong> to schedule a quick discovery chat or share a tailored roadmap.</li>
          </ul>
        </div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.6;">
          Want to add reference links or extra notes? Just reply directly to this email.
        </p>
        <p style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 20px; margin-bottom: 0;">
          — The Kredibly &amp; Akinbyte Build Team
        </p>
      </div>
    `;

    await Promise.allSettled([
      this.send({
        to: "Akinyemioluwaseunjunior@gmail.com",
        subject: `Custom Build Request: ${data.projectType} (${data.name})`,
        html: adminHtml,
        text: `New Custom Build Inquiry\nName: ${data.name}\nPhone: ${data.phone}\nEmail: ${data.email}\nProject: ${data.projectType}\nBudget: ${data.budget || "Not specified"}\nTimeline: ${data.timeline}\nDetails: ${data.details || "None"}`,
      }),
      this.send({
        to: data.email,
        subject: `We received your ${data.projectType} brief — Kredibly & Akinbyte`,
        html: clientHtml,
        text: `Hi ${data.name},\n\nThank you for reaching out about your ${data.projectType}. Our team has received your project brief and someone will get back to you within 24 hours.\n\n— Kredibly & Akinbyte Technologies Limited`,
      }),
    ]);
  }

  /**
   * Notify usekredibly@gmail.com of a new newsletter subscriber
   * and send a creative welcome email to the subscriber.
   */
  static async sendNewsletterWelcomeEmail(subscriberEmail: string) {
    const welcomeHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 14px;">
        <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #2e1065; margin: 0 0 8px;">Welcome to Kredibly</p>
        <h2 style="margin: 0 0 12px; color: #0f172a; font-size: 22px;">You&apos;re officially in the loop!</h2>
        <p style="font-size: 14px; line-height: 1.65; color: #334155;">
          Thanks for subscribing to Kredibly updates. You&apos;ve joined independent brands and Nigerian social sellers building faster, cleaner online storefronts.
        </p>
        <div style="background: #f7f4fc; border: 1px solid #e9d5ff; border-radius: 10px; padding: 16px; margin: 18px 0;">
          <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; color: #2e1065;">Here&apos;s what you can expect from us:</p>
          <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #334155; line-height: 1.75;">
            <li><strong>Merchant Growth Playbooks:</strong> Practical tips to convert Instagram &amp; WhatsApp browsers into paying orders.</li>
            <li><strong>Product Drops &amp; New Tools:</strong> Early access to storefront upgrades, Kredibly AI features, and checkout improvements.</li>
            <li><strong>Zero Fluff:</strong> Only actionable e-commerce insights — no spam, ever.</li>
          </ul>
        </div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.6;">
          Ready to launch your storefront? Visit <a href="https://usekredibly.com/register" style="color: #2e1065; font-weight: 600;">usekredibly.com</a> anytime.
        </p>
        <p style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 20px; margin-bottom: 0;">
          — Team Kredibly
        </p>
      </div>
    `;

    await Promise.allSettled([
      this.send({
        to: "usekredibly@gmail.com",
        subject: `New Kredibly Newsletter Subscriber: ${subscriberEmail}`,
        html: `<p style="font-family: sans-serif;">New subscriber joined <strong>Stay in the Loop</strong>: <strong>${this.escapeHtml(subscriberEmail)}</strong></p>`,
        text: `New Stay in the Loop subscriber: ${subscriberEmail}`,
      }),
      this.send({
        to: subscriberEmail,
        subject: "You're in the loop! Welcome to Kredibly",
        html: welcomeHtml,
        text: "Thanks for subscribing to Kredibly! Expect merchant growth playbooks, new storefront feature drops, and practical e-commerce insights with zero spam. — Team Kredibly",
      }),
    ]);
  }
}
