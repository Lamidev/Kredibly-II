import dns from "dns/promises";

const TRUSTED_PROVIDERS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "ymail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
  "zoho.com",
  "yandex.com",
]);

const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com",
  "10minutemail.net",
  "10minemail.com",
  "20minutemail.com",
  "33mail.com",
  "anonbox.net",
  "burnermail.io",
  "byom.de",
  "crazymailing.com",
  "discard.email",
  "disposablemail.com",
  "dispostable.com",
  "dropmail.me",
  "emailondeck.com",
  "emailsensei.com",
  "fakeinbox.com",
  "fakemail.net",
  "fakemailgenerator.com",
  "filzmail.com",
  "getairmail.com",
  "getnada.com",
  "gmailnator.com",
  "guerrillamail.biz",
  "guerrillamail.com",
  "guerrillamail.de",
  "guerrillamail.info",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "harakirimail.com",
  "inboxbear.com",
  "incognitomail.org",
  "instant-mail.de",
  "jetable.org",
  "koszmail.pl",
  "mailcatch.com",
  "maildrop.cc",
  "mailexpire.com",
  "mailinator.com",
  "mailinator.net",
  "mailinator2.com",
  "mailnesia.com",
  "mailnull.com",
  "mailsac.com",
  "mailtemp.info",
  "mintemail.com",
  "moakt.com",
  "mohmal.com",
  "my10minutemail.com",
  "mytemp.email",
  "nada.email",
  "nada.ltd",
  "nowmymail.com",
  "pokemail.net",
  "sharklasers.com",
  "spam4.me",
  "spambox.us",
  "spamfree24.org",
  "spamgourmet.com",
  "spaml.com",
  "temp-mail.io",
  "temp-mail.org",
  "temp-mail.ru",
  "tempail.com",
  "tempemail.co",
  "tempemail.net",
  "tempinbox.com",
  "tempmail.com",
  "tempmail.de",
  "tempmail.net",
  "tempmail.org",
  "tempmailo.com",
  "tempr.email",
  "throwawaymail.com",
  "trashmail.at",
  "trashmail.com",
  "trashmail.de",
  "trashmail.me",
  "trashmail.net",
  "trashmail.org",
  "wegwerfemail.de",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
]);

const DISPOSABLE_MX_HOSTS = [
  "mailinator.com",
  "yopmail.com",
  "guerrillamail.com",
  "temp-mail.org",
  "10minutemail.com",
  "trashmail.com",
  "dropmail.me",
  "moakt.com",
  "getnada.com",
];

const domainCache = new Map<string, { disposable: boolean; expiresAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function matchesKnownDisposable(domain: string): boolean {
  if (DISPOSABLE_DOMAINS.has(domain)) return true;
  const labels = domain.split(".");
  if (labels.length > 2) {
    const parent = labels.slice(-2).join(".");
    if (DISPOSABLE_DOMAINS.has(parent)) return true;
  }
  return false;
}

async function checkMxRecords(domain: string): Promise<"ok" | "disposable" | "no_mx"> {
  try {
    const records = await Promise.race([
      dns.resolveMx(domain),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("MX_TIMEOUT")), 1500)
      ),
    ]);

    if (!records || records.length === 0) return "no_mx";

    for (const rec of records) {
      const host = rec.exchange.toLowerCase();
      if (DISPOSABLE_MX_HOSTS.some((d) => host === d || host.endsWith(`.${d}`))) {
        return "disposable";
      }
    }
    return "ok";
  } catch (err: any) {
    if (err?.code === "ENOTFOUND" || err?.code === "ENODATA") {
      return "no_mx";
    }
    return "ok"; // fail-open on transient DNS timeout
  }
}

async function checkKickboxDisposable(domain: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);
  try {
    const res = await fetch(
      `https://open.kickbox.com/v1/disposable/${encodeURIComponent(domain)}`,
      { signal: controller.signal }
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { disposable?: boolean };
    return Boolean(data?.disposable);
  } catch {
    return false; // fail-open on timeout/network error
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Dynamically checks if an email belongs to a temporary/disposable or non-existent mail domain.
 */
export async function isDisposableEmail(email: string): Promise<boolean> {
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2 || !parts[1]) return false;

  const domain = parts[1];
  if (TRUSTED_PROVIDERS.has(domain)) return false;
  if (matchesKnownDisposable(domain)) return true;

  const cached = domainCache.get(domain);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.disposable;
  }

  const [mxStatus, kickboxFlag] = await Promise.all([
    checkMxRecords(domain),
    checkKickboxDisposable(domain),
  ]);

  const isBlocked = mxStatus === "disposable" || mxStatus === "no_mx" || kickboxFlag;
  domainCache.set(domain, {
    disposable: isBlocked,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return isBlocked;
}
