import { ENV } from "../config/env";
import { AppError } from "../middleware/errorHandler";

export interface DojahIdentityResult {
  fullName: string;
  firstName: string;
  lastName: string;
}

export class DojahService {
  static async verifyIdentity(
    idType: "NIN" | "BVN",
    idNumber: string
  ): Promise<DojahIdentityResult> {
    const cleanNumber = idNumber.trim();
    if (!/^\d{11}$/.test(cleanNumber)) {
      throw new AppError(`Please enter a valid 11-digit ${idType}.`, 400);
    }

    if (!ENV.DOJAH_APP_ID || !ENV.DOJAH_PRIVATE_KEY) {
      if (ENV.NODE_ENV === "production") {
        throw new AppError(
          "Identity verification service is not configured. Please contact support.",
          503
        );
      }
      return {
        fullName: "DEV VERIFIED MERCHANT",
        firstName: "DEV",
        lastName: "MERCHANT",
      };
    }

    const endpoint =
      idType === "NIN"
        ? `${ENV.DOJAH_BASE_URL}/api/v1/kyc/nin?nin=${encodeURIComponent(cleanNumber)}`
        : `${ENV.DOJAH_BASE_URL}/api/v1/kyc/bvn/full?bvn=${encodeURIComponent(cleanNumber)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          AppId: ENV.DOJAH_APP_ID,
          Authorization: ENV.DOJAH_PRIVATE_KEY,
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      const json = (await response.json().catch(() => ({}))) as any;

      if (!response.ok || !json?.entity) {
        const errMsg =
          json?.error ||
          json?.message ||
          `Could not verify ${idType}. Please check the number and try again.`;
        throw new AppError(errMsg, 400);
      }

      const entity = json.entity;
      const firstName = String(entity.first_name || entity.firstname || "").trim();
      const middleName = String(entity.middle_name || entity.middlename || "").trim();
      const lastName = String(entity.last_name || entity.lastname || entity.surname || "").trim();
      const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ").trim();

      if (!fullName) {
        throw new AppError(
          `Verification succeeded but no name was returned for this ${idType}.`,
          400
        );
      }

      return {
        fullName,
        firstName,
        lastName,
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      if (err?.name === "AbortError") {
        throw new AppError("Identity verification timed out. Please try again.", 504);
      }
      console.error("Dojah verification error:", err);
      throw new AppError("Unable to reach identity verification service right now.", 502);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Checks whether at least 2 name tokens from the verified ID match the merchant's owner name or bank account name.
   */
  static namesMatch(
    verifiedFullName: string,
    candidates: Array<string | null | undefined>
  ): boolean {
    const tokenize = (s: string) =>
      s
        .toUpperCase()
        .replace(/[^A-Z\s]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length >= 2);

    const verifiedTokens = new Set(tokenize(verifiedFullName));
    if (verifiedTokens.size === 0) return false;

    for (const candidate of candidates) {
      if (!candidate) continue;
      const candTokens = tokenize(candidate);
      const matches = candTokens.filter((t) => verifiedTokens.has(t));
      if (matches.length >= Math.min(2, verifiedTokens.size)) {
        return true;
      }
    }

    return false;
  }
}
