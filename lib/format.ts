export function formatPrice(pence: number): string {
  const pounds = pence / 100;
  const whole = Number.isInteger(pounds);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(pounds);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getUTCFullYear()}`;
}

export function formatMonthYear(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatHeight(inches: number): string {
  if (!inches || inches < 0) return "";
  const hands = Math.floor(inches / 4);
  const remainder = inches % 4;
  return `${hands}.${remainder}hh`;
}

export function parseHands(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2})(?:\.([0-3]))?$/);
  if (!match) return null;
  const hands = Number(match[1]);
  if (hands < 8 || hands > 19) return null;
  return hands * 4 + Number(match[2] || 0);
}

export function formatAge(years: number, months = 0): string {
  if (years <= 0 && months > 0) return months === 1 ? "1 month" : `${months} months`;
  if (years <= 0) return "";
  return years === 1 ? "1 yr" : `${years} yrs`;
}

export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const remain = total % 60;
  return `${minutes}:${String(remain).padStart(2, "0")}`;
}

export function poundsToPence(input: string): number | null {
  const cleaned = input.replace(/£/g, "").replace(/,/g, "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, fraction = ""] = cleaned.split(".");
  const pence = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(pence) || pence < 0 || pence > 50_000_000) return null;
  return pence;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
