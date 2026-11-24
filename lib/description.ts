import { formatAge, formatHeight, formatPrice } from "./format";

export type DescriptionInput = {
  horseName: string;
  type: string;
  breed: string;
  ageYears: number;
  ageMonths: number;
  heightInches: number;
  colour: string;
  sex: string;
  level: string;
  suits: string;
  town: string;
  county: string;
  pricePence: number;
  traits: Array<{ key: string; value: string }>;
};

const TRAIT_LABELS: Record<string, string> = {
  hack: "hack",
  load: "load",
  clip: "clip",
  shoe: "shoe",
  box: "box",
  traffic: "go in traffic",
  stable: "stable",
  catch: "catch",
  horses: "be with other horses",
  children: "be with children",
  dogs: "be with dogs",
};

export function draftDescription(input: DescriptionInput): string {
  const name = input.horseName.trim() || "This horse";
  const age = formatAge(input.ageYears, input.ageMonths);
  const height = formatHeight(input.heightInches);
  const who = [input.colour, input.sex].filter(Boolean).join(" ").toLowerCase();
  const parts: string[] = [];

  if (input.type === "horsebox") {
    parts.push(
      `${name} is a ${input.breed || "horsebox"} advertised near ${input.town || "the seller"}${input.county ? `, ${input.county}` : ""}.`,
    );
    parts.push("Arrange to see it in person and check the paperwork before you pay anything.");
    return parts.join(" ");
  }

  if (input.type === "transport") {
    parts.push(
      `${name} offers horse transport${input.town ? ` from ${input.town}` : ""}${input.county ? `, ${input.county}` : ""}.`,
    );
    if (input.pricePence) parts.push(`The guide price shown is ${formatPrice(input.pricePence)}.`);
    parts.push("Ask what is included, and agree the journey in writing before you send any money.");
    return parts.join(" ");
  }

  const opening = [
    name,
    "is",
    age ? `a ${age} old` : "a",
    who || input.type,
    height ? `standing ${height}` : "",
    input.breed ? `(${input.breed})` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ");
  const place = [input.town, input.county].filter(Boolean).join(", ");
  parts.push(`${opening}.${place ? ` Based near ${place}.` : ""}`);
  if (input.suits) parts.push(`Suited to: ${input.suits}.`);
  if (input.level) parts.push(`Current level: ${input.level}.`);
  const yes = input.traits.filter((trait) => trait.value === "yes").map((trait) => TRAIT_LABELS[trait.key] || trait.key);
  if (yes.length) parts.push(`The seller says the horse is good to ${joinList(yes)}.`);
  parts.push(
    "Watch the video, read the documents, and see the horse in person. Have your own vetting done before you agree a sale. VerifiedHorses is a listings platform only and is not part of the sale.",
  );
  return parts.join(" ");
}

function joinList(items: string[]): string {
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function socialCaption(input: {
  title: string;
  town: string;
  pricePence: number;
  url: string;
}): string {
  return `For sale near ${input.town}: ${input.title}. ${formatPrice(input.pricePence)}. ID-checked seller on VerifiedHorses. ${input.url}`;
}

export function advertHeading(input: {
  horseName: string;
  type: string;
  breed: string;
  colour: string;
  sex: string;
  heightInches: number;
  ageYears: number;
  ageMonths: number;
  town: string;
}): string {
  if (input.type === "horsebox" || input.type === "transport") {
    return [input.horseName || input.breed || "Advert", input.town].filter(Boolean).join(", ");
  }
  const age = formatAge(input.ageYears, input.ageMonths);
  const height = formatHeight(input.heightInches);
  return [input.horseName, input.colour, input.sex, input.breed, height, age, input.town]
    .filter(Boolean)
    .join(", ");
}

export function seoTitle(input: {
  colour: string;
  sex: string;
  breed: string;
  heightInches: number;
  ageYears: number;
  ageMonths: number;
  town: string;
  type: string;
  verified: boolean;
}): string {
  if (input.type === "horsebox") {
    return `${input.breed || "Horsebox"} for sale near ${input.town || "the seller"}`;
  }
  if (input.type === "transport") {
    return `Horse transport near ${input.town || "you"}`;
  }
  const bits = [
    input.colour,
    input.sex,
    formatHeight(input.heightInches),
    formatAge(input.ageYears, input.ageMonths),
    input.breed,
    input.verified ? "verified seller" : "",
    input.town,
  ].filter(Boolean);
  return bits.join(", ");
}
