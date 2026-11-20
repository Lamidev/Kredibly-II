declare global {
  interface Window {
    gtag?: (
      command: "config" | "event" | "js",
      targetOrEvent: string | Date,
      params?: Record<string, string | number | boolean | undefined>
    ) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Safely dispatches a Google Analytics 4 custom event when gtag is loaded.
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | undefined>
): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }
  window.gtag("event", eventName, params);
}
