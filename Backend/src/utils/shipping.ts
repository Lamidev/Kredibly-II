export interface ShippingConfig {
  defaultFee: number;
  freeDeliveryEnabled: boolean;
  freeDeliveryScope: "ALL" | "SELECTED";
  freeDeliveryStates: string[];
  freeDeliveryMinOrder?: number | null;
  stateRates: Record<string, number>;
}

export function calculateShippingFee(
  rawConfig: unknown,
  state: string,
  subtotal: number
): number {
  if (!rawConfig || typeof rawConfig !== "object") return 0;
  const cfg = rawConfig as Partial<ShippingConfig>;
  const cleanState = (state || "").trim().toLowerCase();

  // Check Free Delivery eligibility
  if (cfg.freeDeliveryEnabled) {
    const minOrder = Number(cfg.freeDeliveryMinOrder || 0);
    const meetsMinOrder = minOrder <= 0 || subtotal >= minOrder;

    if (meetsMinOrder) {
      if (cfg.freeDeliveryScope === "ALL") {
        return 0;
      }
      if (
        cfg.freeDeliveryScope === "SELECTED" &&
        Array.isArray(cfg.freeDeliveryStates) &&
        cfg.freeDeliveryStates.some((s) => s.trim().toLowerCase() === cleanState)
      ) {
        return 0;
      }
    }
  }

  // Check state-specific override
  if (cfg.stateRates && typeof cfg.stateRates === "object") {
    for (const [k, v] of Object.entries(cfg.stateRates)) {
      if (k.trim().toLowerCase() === cleanState) {
        const fee = Number(v);
        if (!Number.isNaN(fee) && fee >= 0) return fee;
      }
    }
  }

  const fallback = Number(cfg.defaultFee || 0);
  return !Number.isNaN(fallback) && fallback >= 0 ? fallback : 0;
}
