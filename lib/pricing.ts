export type PricingDefault = {
  slug: string;
  name: string;
  description: string;
  pricePence: number;
  kind: "until_sold" | "monthly";
  appliesTo: string;
  sortOrder: number;
};

export const PRICING_DEFAULTS: PricingDefault[] = [
  {
    slug: "standard",
    name: "Standard, until sold",
    description:
      "A standard private advert. It stays up until you mark it sold. Placeholder price for Steve to confirm. For reference, HorseQuest charges £38 for 6 weeks.",
    pricePence: 2900,
    kind: "until_sold",
    appliesTo: "horse,pony,cob",
    sortOrder: 1,
  },
  {
    slug: "plus",
    name: "PLUS, until sold",
    description:
      "The standard advert, a PLUS badge, a higher place in search, and a caption you can copy for a social post. Placeholder price. For reference, HorseQuest PLUS is £48 for 6 weeks.",
    pricePence: 3900,
    kind: "until_sold",
    appliesTo: "horse,pony,cob,youngstock",
    sortOrder: 2,
  },
  {
    slug: "youngstock",
    name: "Youngstock, until sold",
    description: "For foals, yearlings and other youngstock. Placeholder price for Steve to confirm.",
    pricePence: 1900,
    kind: "until_sold",
    appliesTo: "youngstock",
    sortOrder: 3,
  },
  {
    slug: "transport",
    name: "Horsebox and transport",
    description: "Horsebox, trailer and transport adverts. Placeholder price for Steve to confirm.",
    pricePence: 4500,
    kind: "until_sold",
    appliesTo: "horsebox,transport",
    sortOrder: 4,
  },
  {
    slug: "trade",
    name: "Trade, monthly",
    description:
      "Monthly placeholder for dealers and yards. It adds a trade badge only for now. Yard pages come later. Steve will set the price.",
    pricePence: 5900,
    kind: "monthly",
    appliesTo: "trade",
    sortOrder: 5,
  },
];

export function defaultTierForType(type: string): string {
  if (type === "youngstock") return "youngstock";
  if (type === "horsebox" || type === "transport") return "transport";
  return "standard";
}

export function tiersForAdvert(type: string): string[] {
  const slugs = PRICING_DEFAULTS.filter(
    (tier) => tier.kind === "until_sold" && tier.appliesTo.split(",").includes(type),
  ).map((tier) => tier.slug);
  if (!slugs.includes("plus") && type !== "horsebox" && type !== "transport") slugs.push("plus");
  return slugs.length ? slugs : ["standard"];
}
