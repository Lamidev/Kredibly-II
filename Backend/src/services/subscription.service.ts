import { SubscriptionTier } from "@prisma/client";
import { prisma } from "../config/db";
import { ENV } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { PushService } from "./push.service";
import { EmailService } from "./email.service";

export const DEFAULT_PLANS: Array<{
  tier: SubscriptionTier;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  maxProducts: number;
  maxImagesPerProduct: number;
  platformFeePercent: number;
  allowPassFee: boolean;
  allowPromoCodes: boolean;
  allowOfferBanner: boolean;
  allowCustomDomain: boolean;
}> = [
  {
    tier: "STARTER",
    name: "Starter (Free)",
    tagline: "Test the waters — up to 20 products with 2.5% transaction fee.",
    monthlyPrice: 0,
    annualPrice: 0,
    maxProducts: 20,
    maxImagesPerProduct: 2,
    platformFeePercent: 2.5,
    allowPassFee: false,
    allowPromoCodes: false,
    allowOfferBanner: false,
    allowCustomDomain: false,
  },
  {
    tier: "STARTER_PLUS",
    name: "Starter Plus",
    tagline: "Zero platform commission — keep 100% of your asking prices.",
    monthlyPrice: 5000,
    annualPrice: 50000,
    maxProducts: 50,
    maxImagesPerProduct: 2,
    platformFeePercent: 0,
    allowPassFee: true,
    allowPromoCodes: false,
    allowOfferBanner: false,
    allowCustomDomain: false,
  },
  {
    tier: "PRO",
    name: "Deluxe (Pro)",
    tagline: "Up to 200 products, discount codes & exclusive offer banner.",
    monthlyPrice: 10000,
    annualPrice: 100000,
    maxProducts: 200,
    maxImagesPerProduct: 3,
    platformFeePercent: 0,
    allowPassFee: true,
    allowPromoCodes: true,
    allowOfferBanner: true,
    allowCustomDomain: false,
  },
  {
    tier: "BUSINESS",
    name: "Ultimate (Scale)",
    tagline: "1,000+ products, free .com.ng domain (annual) & priority support.",
    monthlyPrice: 20000,
    annualPrice: 200000,
    maxProducts: 2000,
    maxImagesPerProduct: 5,
    platformFeePercent: 0,
    allowPassFee: true,
    allowPromoCodes: true,
    allowOfferBanner: true,
    allowCustomDomain: true,
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

export function computeDaysRemaining(subscriptionEnd: Date | null | undefined) {
  if (!subscriptionEnd) return { daysRemaining: null as number | null, isInGracePeriod: false };
  const diffMs = subscriptionEnd.getTime() - Date.now();
  const days = Math.ceil(diffMs / DAY_MS);
  const isInGracePeriod = diffMs < 0 && diffMs >= -3 * DAY_MS;
  return { daysRemaining: days, isInGracePeriod };
}

export class SubscriptionService {
  static async ensureDefaultPlans() {
    const existing = await prisma.subscriptionPlan.findMany();
    const existingTiers = new Set(existing.map((p) => p.tier));
    const missing = DEFAULT_PLANS.filter((p) => !existingTiers.has(p.tier));
    if (missing.length > 0) {
      await prisma.subscriptionPlan.createMany({
        data: missing,
        skipDuplicates: true,
      });
    }
    const all = await prisma.subscriptionPlan.findMany();
    const order = ["STARTER", "STARTER_PLUS", "PRO", "BUSINESS"];
    return all
      .sort((a, b) => order.indexOf(a.tier) - order.indexOf(b.tier))
      .map((p) => ({
        ...p,
        monthlyPrice: Number(p.monthlyPrice),
        annualPrice: Number(p.annualPrice),
        platformFeePercent: Number(p.platformFeePercent),
      }));
  }

  static async getPlanForTier(tier: SubscriptionTier) {
    const plans = await this.ensureDefaultPlans();
    return plans.find((p) => p.tier === tier) || plans[0];
  }

  static async getMerchantOverview(storeId: string) {
    const [plans, store, productCount, payments] = await Promise.all([
      this.ensureDefaultPlans(),
      prisma.store.findUnique({
        where: { id: storeId },
        select: {
          id: true,
          name: true,
          subscriptionTier: true,
          subscriptionEnd: true,
          wallet: { select: { availableBalance: true } },
        },
      }),
      prisma.product.count({ where: { storeId } }),
      prisma.subscriptionPayment.findMany({
        where: { storeId },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
    ]);

    if (!store) throw new AppError("Store not found", 404);

    const { daysRemaining, isInGracePeriod } = computeDaysRemaining(store.subscriptionEnd);
    const activePlan = plans.find((p) => p.tier === store.subscriptionTier) || plans[0];

    return {
      currentTier: store.subscriptionTier,
      subscriptionEnd: store.subscriptionEnd,
      daysRemaining,
      isInGracePeriod,
      productCount,
      maxImagesPerProduct: activePlan.maxImagesPerProduct,
      walletAvailableBalance: Number(store.wallet?.availableBalance || 0),
      plans,
      payments: payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
    };
  }

  static async upgradeWithWallet(
    storeId: string,
    tier: SubscriptionTier,
    billingCycle: "MONTHLY" | "ANNUAL"
  ) {
    if (tier === "STARTER") {
      throw new AppError("Starter is already free. Choose a paid plan to upgrade.", 400);
    }

    const plan = await this.getPlanForTier(tier);
    const amount = billingCycle === "ANNUAL" ? plan.annualPrice : plan.monthlyPrice;
    if (amount <= 0) {
      throw new AppError("Invalid plan pricing configuration", 400);
    }

    const durationDays = billingCycle === "ANNUAL" ? 365 : 30;
    const reference = `SUB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await prisma.$transaction(async (tx) => {
      const store = await tx.store.findUnique({
        where: { id: storeId },
        include: { wallet: true },
      });
      if (!store || !store.wallet) {
        throw new AppError("Store wallet not found", 404);
      }

      const debit = await tx.wallet.updateMany({
        where: {
          id: store.wallet.id,
          availableBalance: { gte: amount },
        },
        data: {
          availableBalance: { decrement: amount },
        },
      });

      if (debit.count === 0) {
        throw new AppError(
          `Insufficient available wallet balance. You need ₦${amount.toLocaleString("en-NG")} to activate ${plan.name}.`,
          400
        );
      }

      const now = new Date();
      const baseStart =
        store.subscriptionTier === tier &&
        store.subscriptionEnd &&
        store.subscriptionEnd > now
          ? store.subscriptionEnd
          : now;
      const periodEnd = new Date(baseStart.getTime() + durationDays * DAY_MS);

      await tx.transaction.create({
        data: {
          walletId: store.wallet.id,
          amount,
          platformFee: 0,
          netAmount: amount,
          type: "SUBSCRIPTION_DEDUCTION",
          status: "COMPLETED",
          reference,
        },
      });

      const updatedStore = await tx.store.update({
        where: { id: storeId },
        data: {
          subscriptionTier: tier,
          subscriptionEnd: periodEnd,
          lastRenewalReminderAt: null,
        },
      });

      const payment = await tx.subscriptionPayment.create({
        data: {
          storeId,
          tier,
          billingCycle,
          amount,
          paymentMethod: "WALLET",
          reference,
          status: "COMPLETED",
          periodStart: baseStart,
          periodEnd,
        },
      });

      return { updatedStore, payment, storeName: store.name };
    });

    PushService.sendStorePush(storeId, {
      title: `${plan.name} Activated`,
      body: `${result.storeName} · ₦${amount.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} (${billingCycle === "ANNUAL" ? "1 Year" : "30 Days"})`,
      url: "/dashboard/billing",
    }).catch(() => {});

    return {
      tier: result.updatedStore.subscriptionTier,
      subscriptionEnd: result.updatedStore.subscriptionEnd,
      payment: { ...result.payment, amount: Number(result.payment.amount) },
    };
  }

  static async initializePaystackUpgrade(
    storeId: string,
    tier: SubscriptionTier,
    billingCycle: "MONTHLY" | "ANNUAL",
    email: string
  ) {
    if (!ENV.PAYSTACK_SECRET_KEY) {
      throw new AppError(
        "Card payment is not configured yet. Please pay using your Kredibly Wallet balance.",
        400
      );
    }
    if (tier === "STARTER") {
      throw new AppError("Starter is already free.", 400);
    }

    const plan = await this.getPlanForTier(tier);
    const amount = billingCycle === "ANNUAL" ? plan.annualPrice : plan.monthlyPrice;
    const reference = `SUB-PS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const durationDays = billingCycle === "ANNUAL" ? 365 : 30;
    const periodEnd = new Date(now.getTime() + durationDays * DAY_MS);

    await prisma.subscriptionPayment.create({
      data: {
        storeId,
        tier,
        billingCycle,
        amount,
        paymentMethod: "PAYSTACK",
        reference,
        status: "PENDING",
        periodStart: now,
        periodEnd,
      },
    });

    const resp = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100),
        reference,
        callback_url: `${ENV.FRONTEND_URL}/dashboard/billing?verify=${reference}`,
        metadata: { storeId, tier, billingCycle },
      }),
    });

    const json = (await resp.json().catch(() => ({}))) as any;
    if (!resp.ok || !json?.status || !json?.data?.authorization_url) {
      await prisma.subscriptionPayment.update({
        where: { reference },
        data: { status: "FAILED" },
      });
      throw new AppError(json?.message || "Could not initialize card payment.", 502);
    }

    return {
      authorizationUrl: json.data.authorization_url as string,
      reference,
    };
  }

  static async verifyPaystackUpgrade(storeId: string, reference: string) {
    const payment = await prisma.subscriptionPayment.findFirst({
      where: { reference, storeId },
    });
    if (!payment) throw new AppError("Subscription payment record not found", 404);
    if (payment.status === "COMPLETED") {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { subscriptionTier: true, subscriptionEnd: true },
      });
      return { alreadyProcessed: true, ...store };
    }

    if (!ENV.PAYSTACK_SECRET_KEY) {
      throw new AppError("Paystack key not configured", 500);
    }

    const resp = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${ENV.PAYSTACK_SECRET_KEY}` },
      }
    );
    const json = (await resp.json().catch(() => ({}))) as any;
    if (!resp.ok || !json?.status || json?.data?.status !== "success") {
      throw new AppError("Payment has not been completed yet.", 400);
    }

    const durationDays = payment.billingCycle === "ANNUAL" ? 365 : 30;
    const now = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const claimed = await tx.subscriptionPayment.updateMany({
        where: { id: payment.id, status: "PENDING" },
        data: { status: "COMPLETED" },
      });
      const store = await tx.store.findUniqueOrThrow({ where: { id: storeId } });
      if (claimed.count === 0) return store;

      const baseStart =
        store.subscriptionTier === payment.tier &&
        store.subscriptionEnd &&
        store.subscriptionEnd > now
          ? store.subscriptionEnd
          : now;
      const periodEnd = new Date(baseStart.getTime() + durationDays * DAY_MS);

      await tx.subscriptionPayment.update({
        where: { id: payment.id },
        data: { periodStart: baseStart, periodEnd },
      });

      return tx.store.update({
        where: { id: storeId },
        data: {
          subscriptionTier: payment.tier,
          subscriptionEnd: periodEnd,
          lastRenewalReminderAt: null,
        },
      });
    });

    return {
      tier: updated.subscriptionTier,
      subscriptionEnd: updated.subscriptionEnd,
    };
  }

  static async getAdminOverview() {
    const [plans, stores, completedPayments, freePlanFeeAgg] = await Promise.all([
      this.ensureDefaultPlans(),
      prisma.store.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          subscriptionTier: true,
          subscriptionEnd: true,
          createdAt: true,
          owner: {
            select: { fullName: true, email: true, phoneNumber: true },
          },
          _count: { select: { products: true } },
        },
      }),
      prisma.subscriptionPayment.findMany({
        where: { status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        include: {
          store: { select: { name: true, slug: true } },
        },
      }),
      prisma.transaction.aggregate({
        where: {
          type: "SALE",
          status: "COMPLETED",
          wallet: { store: { subscriptionTier: "STARTER" } },
        },
        _sum: { platformFee: true, amount: true },
        _count: { id: true },
      }),
    ]);

    const now = new Date();
    const paidTiers: SubscriptionTier[] = ["STARTER_PLUS", "PRO", "BUSINESS"];

    const paymentSumByStore = new Map<string, number>();
    const paymentByTier = new Map<SubscriptionTier, { totalPaid: number; count: number }>();
    for (const tier of paidTiers) {
      paymentByTier.set(tier, { totalPaid: 0, count: 0 });
    }

    let totalPaidSubscriptionRevenue = 0;
    for (const p of completedPayments) {
      const amt = Number(p.amount);
      totalPaidSubscriptionRevenue += amt;
      paymentSumByStore.set(p.storeId, (paymentSumByStore.get(p.storeId) || 0) + amt);
      const bucket = paymentByTier.get(p.tier);
      if (bucket) {
        bucket.totalPaid += amt;
        bucket.count += 1;
      }
    }

    let activePaidSubscriptionsCount = 0;
    let expiringSoonCount = 0;
    const activeCountByTier = new Map<SubscriptionTier, number>();

    const storeRows = stores.map((s) => {
      const { daysRemaining, isInGracePeriod } = computeDaysRemaining(s.subscriptionEnd);
      const isPaidTier = s.subscriptionTier !== "STARTER";
      const isActivePaid =
        isPaidTier &&
        (!s.subscriptionEnd || s.subscriptionEnd > now || isInGracePeriod);

      if (isActivePaid) {
        activePaidSubscriptionsCount++;
        activeCountByTier.set(
          s.subscriptionTier,
          (activeCountByTier.get(s.subscriptionTier) || 0) + 1
        );
      }

      if (
        isPaidTier &&
        daysRemaining !== null &&
        daysRemaining >= 0 &&
        daysRemaining <= 7
      ) {
        expiringSoonCount++;
      }

      return {
        id: s.id,
        name: s.name,
        slug: s.slug,
        ownerName: s.owner.fullName,
        ownerEmail: s.owner.email,
        ownerPhone: s.owner.phoneNumber,
        subscriptionTier: s.subscriptionTier,
        subscriptionEnd: s.subscriptionEnd,
        daysRemaining,
        isInGracePeriod,
        productCount: s._count.products,
        totalPaid: paymentSumByStore.get(s.id) || 0,
        createdAt: s.createdAt,
      };
    });

    const paidPlanBreakdown = paidTiers.map((tier) => {
      const plan = plans.find((p) => p.tier === tier)!;
      const stats = paymentByTier.get(tier)!;
      return {
        tier,
        name: plan.name,
        monthlyPrice: plan.monthlyPrice,
        totalPaid: stats.totalPaid,
        paymentsCount: stats.count,
        activeCount: activeCountByTier.get(tier) || 0,
      };
    });

    return {
      totalPaidSubscriptionRevenue,
      freePlanProfit: Number(freePlanFeeAgg._sum.platformFee || 0),
      freePlanSalesVolume: Number(freePlanFeeAgg._sum.amount || 0),
      freePlanPaidOrders: freePlanFeeAgg._count.id,
      freePlanStoresCount: stores.filter((s) => s.subscriptionTier === "STARTER").length,
      activePaidSubscriptionsCount,
      expiringSoonCount,
      paidPlanBreakdown,
      plans,
      stores: storeRows,
      recentPayments: completedPayments.slice(0, 30).map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
    };
  }

  static async updatePlanConfig(
    tier: SubscriptionTier,
    data: {
      name?: string;
      tagline?: string | null;
      monthlyPrice?: number;
      annualPrice?: number;
      maxProducts?: number;
      maxImagesPerProduct?: number;
      platformFeePercent?: number;
      allowPassFee?: boolean;
      allowPromoCodes?: boolean;
      allowOfferBanner?: boolean;
      allowCustomDomain?: boolean;
      isActive?: boolean;
    }
  ) {
    await this.ensureDefaultPlans();
    const updated = await prisma.subscriptionPlan.update({
      where: { tier },
      data,
    });
    return {
      ...updated,
      monthlyPrice: Number(updated.monthlyPrice),
      annualPrice: Number(updated.annualPrice),
      platformFeePercent: Number(updated.platformFeePercent),
    };
  }

  static async adminUpdateStoreSubscription(
    storeId: string,
    tier: SubscriptionTier,
    durationDays: number,
    amountPaid = 0
  ) {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new AppError("Store not found", 404);

    const now = new Date();
    const periodEnd =
      tier === "STARTER"
        ? null
        : new Date(now.getTime() + Math.max(1, durationDays) * DAY_MS);

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.store.update({
        where: { id: storeId },
        data: {
          subscriptionTier: tier,
          subscriptionEnd: periodEnd,
          lastRenewalReminderAt: null,
          ...(tier === "STARTER" ? { passFeeToCustomer: false } : {}),
        },
      });

      if (tier !== "STARTER" && periodEnd) {
        await tx.subscriptionPayment.create({
          data: {
            storeId,
            tier,
            billingCycle: durationDays >= 360 ? "ANNUAL" : "MONTHLY",
            amount: Math.max(0, amountPaid),
            paymentMethod: "ADMIN_GRANT",
            reference: `ADM-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
            status: "COMPLETED",
            periodStart: now,
            periodEnd,
          },
        });
      }

      return s;
    });

    return updated;
  }

  /**
   * Daily cron: send renewal reminders at 3d & 1d before expiry,
   * and downgrade stores past the 3-day grace period back to STARTER.
   */
  static async processSubscriptionLifecycle() {
    const now = new Date();
    const graceCutoff = new Date(now.getTime() - 3 * DAY_MS);
    const threeDaysFromNow = new Date(now.getTime() + 3 * DAY_MS);
    const reminderCooldown = new Date(now.getTime() - 20 * 60 * 60 * 1000);

    // 1. Downgrade expired stores past 3-day grace period
    const expiredStores = await prisma.store.findMany({
      where: {
        subscriptionTier: { not: "STARTER" },
        subscriptionEnd: { lt: graceCutoff },
      },
      select: { id: true, name: true },
    });

    for (const st of expiredStores) {
      await prisma.store.update({
        where: { id: st.id },
        data: {
          subscriptionTier: "STARTER",
          subscriptionEnd: null,
          passFeeToCustomer: false,
        },
      });
      PushService.sendStorePush(st.id, {
        title: "Subscription Downgraded to Starter",
        body: `${st.name} · Your paid plan expired. Renew anytime in Billing & Plans.`,
        url: "/dashboard/billing",
      }).catch(() => {});
    }

    // 2. Send reminders for plans expiring within 3 days
    const expiringStores = await prisma.store.findMany({
      where: {
        subscriptionTier: { not: "STARTER" },
        subscriptionEnd: { gte: now, lte: threeDaysFromNow },
        OR: [
          { lastRenewalReminderAt: null },
          { lastRenewalReminderAt: { lt: reminderCooldown } },
        ],
      },
      include: {
        owner: { select: { email: true, fullName: true } },
      },
    });

    for (const st of expiringStores) {
      const { daysRemaining } = computeDaysRemaining(st.subscriptionEnd);
      if (daysRemaining === null || (daysRemaining !== 3 && daysRemaining !== 1 && daysRemaining !== 0)) {
        continue;
      }

      await prisma.store.update({
        where: { id: st.id },
        data: { lastRenewalReminderAt: now },
      });

      const dayLabel = daysRemaining <= 1 ? "tomorrow" : `in ${daysRemaining} days`;
      PushService.sendStorePush(st.id, {
        title: `Plan Renews ${daysRemaining <= 1 ? "Soon" : `in ${daysRemaining} Days`}`,
        body: `${st.name} · Your ${st.subscriptionTier} plan expires ${dayLabel}. Renew to keep all perks.`,
        url: "/dashboard/billing",
      }).catch(() => {});

      if (st.owner?.email) {
        EmailService.send({
          to: st.owner.email,
          subject: `Reminder: Your Kredibly ${st.subscriptionTier} plan expires ${dayLabel}`,
          html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a;">
            <h2 style="margin-top:0;color:#2e1065;">Plan Renewal Reminder</h2>
            <p>Hi ${EmailService.escapeHtml(st.owner.fullName)},</p>
            <p>Your <strong>${st.subscriptionTier}</strong> plan for <strong>${EmailService.escapeHtml(st.name)}</strong> expires <strong>${dayLabel}</strong>.</p>
            <p>Renew from your dashboard under <strong>Billing &amp; Plans</strong> to keep zero platform commission and premium features active.</p>
            <p><a href="${ENV.FRONTEND_URL}/dashboard/billing" style="display:inline-block;background:#2e1065;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;">Renew Plan &rarr;</a></p>
          </div>`,
        }).catch(() => {});
      }
    }
  }
}
