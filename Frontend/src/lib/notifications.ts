import { api } from "@/lib/api";

export const ALERTS_STORAGE_KEY = "kredibly_sale_alerts_enabled";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribePushEndpoint(apiPath: string) {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return;
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey || Notification.permission !== "granted") return;

  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }
    const json = sub.toJSON();
    if (json.endpoint && json.keys?.p256dh && json.keys?.auth) {
      await api.post(apiPath, {
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });
    }
  } catch {
    // ignore push subscription errors on unsupported browsers
  }
}

async function unsubscribePushEndpoint(apiPath: string) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await api.delete(apiPath, {
        data: { endpoint: sub.endpoint },
      });
      await sub.unsubscribe();
    }
  } catch {
    // ignore
  }
}

export async function subscribeMerchantPush() {
  return subscribePushEndpoint("/store/push-subscribe");
}

export async function unsubscribeMerchantPush() {
  return unsubscribePushEndpoint("/store/push-subscribe");
}

export async function subscribeAdminPush() {
  return subscribePushEndpoint("/admin/push-subscribe");
}

export async function unsubscribeAdminPush() {
  return unsubscribePushEndpoint("/admin/push-subscribe");
}

export function areSaleAlertsEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(ALERTS_STORAGE_KEY) !== "false";
}

export function setSaleAlertsEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ALERTS_STORAGE_KEY, enabled ? "true" : "false");
  window.dispatchEvent(new Event("kredibly-alerts-changed"));
}

/**
 * Play a crisp two-tone chime via Web Audio API when a new paid order arrives.
 */
export function playSaleChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(880, now, 0.18);
    playTone(1318.5, now + 0.14, 0.28);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 600);
  } catch {
    // Ignore autoplay restrictions before first user interaction
  }
}
