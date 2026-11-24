export type ScamResult = {
  flags: string[];
  redacted: string;
  masked: boolean;
};

const RULES: Array<[string, RegExp]> = [
  ["deposit", /\b(send|pay|transfer|put down|require[sd]?|want)s?\s+(a\s+)?deposit\b/i],
  ["deposit", /\bdeposit\s+(now|today|before|up front|upfront)\b/i],
  ["bank", /\bbank transfer\b/i],
  ["bank", /\bsort code\b/i],
  ["bank", /\baccount number\b/i],
  ["wire", /\b(western union|moneygram|wire the money)\b/i],
  ["crypto", /\b(bitcoin|crypto|gift card|voucher code)\b/i],
  ["offsite", /\b(whatsapp|telegram)\b/i],
  ["agent", /\b(shipping agent|overseas agent|my agent will|courier will collect)\b/i],
  ["pay-first", /\bpay before (you|viewing|you view|seeing)\b/i],
];

const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE = /(?:\+44\s?|0)(?:\d[\s-]?){9,12}\b/g;

export function analyseMessage(body: string, maskContacts: boolean): ScamResult {
  const flags = new Set<string>();
  for (const [flag, pattern] of RULES) {
    if (pattern.test(body)) flags.add(flag);
  }
  let redacted = body;
  let masked = false;
  if (maskContacts) {
    if (EMAIL.test(body) || PHONE.test(body)) {
      flags.add("contact-details");
      masked = true;
    }
    EMAIL.lastIndex = 0;
    PHONE.lastIndex = 0;
    redacted = body
      .replace(EMAIL, "[email hidden until the seller replies]")
      .replace(PHONE, "[phone hidden until the seller replies]");
  }
  return { flags: [...flags], redacted, masked };
}
