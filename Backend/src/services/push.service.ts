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
  static async sendStorePush(
    storeId: string,
    payload: { title: string; body: string; url?: string }
  ) {
    if (!vapidConfigured) return;

    const subs = await prisma.pushSubscription.findMany({
      where: { storeId },
    });

    if (subs.length === 0) return;

    const message = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/dashboard/orders",
    });

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            message
          );
        } catch (err: any) {
          // Remove expired or unsubscribed endpoints cleanly
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await prisma.pushSubscription
              .delete({ where: { id: sub.id } })
              .catch(() => {});
          }
        }
      })
    );
  }
}
