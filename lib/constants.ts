export const BRAND = "VerifiedHorses";

export const PLATFORM_DISCLAIMER =
  "VerifiedHorses is a listings platform only. It is not a party to any sale, it gives no warranty on horses or sellers, and buyers should arrange their own vetting.";

export const TYPES = [
  { slug: "horse", label: "Horse", plural: "Horses" },
  { slug: "pony", label: "Pony", plural: "Ponies" },
  { slug: "cob", label: "Cob", plural: "Cobs" },
  { slug: "youngstock", label: "Youngstock", plural: "Youngstock" },
  { slug: "horsebox", label: "Horsebox", plural: "Horseboxes" },
  { slug: "transport", label: "Transport", plural: "Transport" },
] as const;

export const CLIPS = [
  ["walk", "Walk"],
  ["trot", "Trot"],
  ["canter", "Canter"],
  ["jump", "Jump"],
  ["stable", "In the stable"],
  ["loading", "Loading"],
  ["hacking", "Hacking"],
] as const;

export const TRAITS = [
  ["hack", "Good to hack"],
  ["load", "Good to load"],
  ["clip", "Good to clip"],
  ["shoe", "Good to shoe"],
  ["box", "Good to box"],
  ["traffic", "Good in traffic"],
  ["stable", "Good to stable"],
  ["catch", "Good to catch"],
  ["horses", "Good with other horses"],
  ["children", "Good with children"],
  ["dogs", "Good with dogs"],
] as const;

export const SUITS = ["First horse", "Novice", "Confident adult", "Child", "Competition", "Happy hacker"];
export const LEVELS = ["Unbacked", "Backed", "Schooling", "Hacking", "Novice", "Intermediate", "Advanced", "Competition"];
export const SEXES = ["Mare", "Gelding", "Stallion", "Colt", "Filly"];
export const COLOURS = ["Bay", "Chestnut", "Grey", "Black", "Dun", "Roan", "Palomino", "Piebald", "Skewbald", "Other"];
export const DOC_KINDS = [
  ["vetting", "Vetting report"],
  ["xrays", "X-rays"],
  ["passport", "Passport"],
  ["microchip", "Microchip"],
] as const;

export const REPORT_REASONS = [
  ["scam", "Possible scam"],
  ["welfare", "Welfare concern"],
  ["inaccurate", "Inaccurate advert"],
  ["duplicate", "Duplicate advert"],
  ["other", "Something else"],
];

export function typeLabel(slug: string): string {
  return TYPES.find((type) => type.slug === slug)?.label || slug;
}

export function typePlural(slug: string): string {
  return TYPES.find((type) => type.slug === slug)?.plural || slug;
}

export function docLabel(kind: string): string {
  return DOC_KINDS.find((item) => item[0] === kind)?.[1] || kind;
}
