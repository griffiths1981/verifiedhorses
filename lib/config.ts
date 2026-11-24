export function baseUrl(): string {
  return (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
}

export function indexingAllowed(): boolean {
  return process.env.ALLOW_INDEXING === "true";
}

export function contactEmail(): string {
  return process.env.CONTACT_EMAIL || "hello@verifiedhorses.example";
}

export function legalEntity(): string {
  return process.env.LEGAL_ENTITY_NAME || "the operator of VerifiedHorses (legal name to be confirmed)";
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function videoServiceConfigured(): boolean {
  return Boolean(process.env.VIDEO_SERVICE_URL && process.env.VIDEO_API_TOKEN);
}

export function showDevEmailLinks(): boolean {
  return !process.env.BREVO_API_KEY && process.env.SHOW_DEV_EMAIL_LINKS !== "false";
}
