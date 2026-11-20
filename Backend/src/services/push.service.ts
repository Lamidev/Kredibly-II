import webpush from "web-push";
import { prisma } from "../config/db";
import { ENV } from "../config/env";

let vapidConfigured = false;
if (ENV.VAPID_PUBLIC_KEY && ENV.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    ENV.VAPID_SUBJECT,
    ENV.VAPID_PUBLIC_KEY,
    ENV.VAPID_PRIVATE_KEY
  );
  vapidConfigured = true;
}

export class PushService {
  private static async sendToSubscriptions(
    subs: Array<{ id: string; endpoint: string; p256dh: string; auth: string }>,
    payload: { title: string; body: string; url?: string },
    defaultUrl: string
  ) {
    if (!vapidConfigured || subs.length === 0) return;

    const message = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || defaultUrl,
    });

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            message,
            {
              urgency: "high",
              TTL: 86400,
            }
          );
        } catch (err: any) {
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await prisma.pushSubscription
              .delete({ where: { id: sub.id } })
              .catch(() => {});
          } else {
            console.error(
              `Push send failed (${err?.statusCode || "unknown"}):`,
              err?.body || err?.message || err
            );
          }
        }
      })
    );
  }

  static async sendStorePush(
    storeId: string,
    payload: { title: string; body: string; url?: string }
  ) {
    if (!vapidConfigured) return;
    const subs = await prisma.pushSubscription.findMany({
      where: { storeId },
    });
    await this.sendToSubscriptions(subs, payload, "/dashboard/orders");
  }

  static async sendAdminPush(payload: { title: string; body: string; url?: string }) {
    if (!vapidConfigured) return;
    const subs = await prisma.pushSubscription.findMany({
      where: { isAdmin: true },
    });
    await this.sendToSubscriptions(subs, payload, "/admin");
  }

  static async sendDailyAdminSummary(settledT1Count: number) {
    if (!vapidConfigured) return;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const agg = await prisma.order.aggregate({
      where: {
        paymentStatus: "PAID",
        createdAt: { gte: since },
      },
      _count: { id: true },
      _sum: { totalAmount: true },
    });
    const orderCount = agg._count.id || 0;
    const gmv = Number(agg._sum.totalAmount || 0).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    await this.sendAdminPush({
      title: "Daily 8:00 AM Kredibly HQ Summary",
      body: `${orderCount} paid orders · ₦${gmv} GMV · ${settledT1Count} T+1 payouts settled`,
      url: "/admin",
    });
  }
}
