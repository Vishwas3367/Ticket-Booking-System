export function holdTtlSeconds() {
  return Number(process.env.HOLD_TTL_SECONDS || 600);
}

export function waitlistOfferSeconds() {
  return Number(process.env.WAITLIST_OFFER_SECONDS || 600);
}

export function holdUntil(from = new Date()) {
  return new Date(from.getTime() + holdTtlSeconds() * 1000);
}

export function offerUntil(from = new Date()) {
  return new Date(from.getTime() + waitlistOfferSeconds() * 1000);
}

export function rowLabel(row: number) {
  let n = row;
  let label = "";
  while (n > 0) {
    n -= 1;
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26);
  }
  return label;
}

export function makeBookingReference() {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TB-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

export function makeOfferToken() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

export function formatMoney(cents: number) {
  return `₹${(cents / 100).toFixed(0)}`;
}
