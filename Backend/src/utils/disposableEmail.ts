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

/**
 * Returns true if the email address belongs to a known temporary / disposable email provider.
 */
export function isDisposableEmail(email: string): boolean {
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2 || !parts[1]) return false;

  const domain = parts[1];
  if (DISPOSABLE_DOMAINS.has(domain)) return true;

  // Check parent domain (e.g., sub.yopmail.com -> yopmail.com)
  const labels = domain.split(".");
  if (labels.length > 2) {
    const parent = labels.slice(-2).join(".");
    if (DISPOSABLE_DOMAINS.has(parent)) return true;
  }

  return false;
}
