import { randomBytes } from "node:crypto";
import { PRICING_DEFAULTS } from "./pricing";
import { hashPassword } from "./password";
import { db } from "./prisma";
import { lookupPlace } from "./places";
import { analyseMessage } from "./scam";
import { newToken } from "./tokens";

function place(outcode: string) {
  const found = lookupPlace(outcode);
  if (!found) throw new Error(`Unknown outcode ${outcode}`);
  return found;
}

export async function seedIfEmpty() {
  const prisma = await db();
  if ((await prisma.pricingTier.count()) === 0) {
    for (const tier of PRICING_DEFAULTS) {
      await prisma.pricingTier.create({ data: tier });
    }
    console.log("Seeded advert prices.");
  }
  await prisma.setting.upsert({
    where: { key: "listings_free" },
    update: {},
    create: { key: "listings_free", value: "false" },
  });

  if (!(await prisma.user.findFirst({ where: { role: "admin" } }))) {
    const password = process.env.ADMIN_INITIAL_PASSWORD || randomBytes(9).toString("base64url");
    await prisma.user.create({
      data: {
        email: "admin@verifiedhorses.example",
        name: "Staging admin",
        passwordHash: await hashPassword(password),
        role: "admin",
        emailVerifiedAt: new Date(),
        referralCode: "admin",
        isDemo: false,
      },
    });
    if (!process.env.ADMIN_INITIAL_PASSWORD) {
      console.log(`Initial admin password (not shown again): ${password}`);
    } else {
      console.log("Created staging admin admin@verifiedhorses.example");
    }
  }

  if (process.env.SEED_DEMO === "false") return;
  if ((await prisma.user.count({ where: { isDemo: true } })) > 0) return;

  const sellerPassword = await hashPassword("Demo-seller-1");
  const buyerPassword = await hashPassword("Demo-buyer-1");
  const amelia = await prisma.user.create({
    data: {
      email: "amelia@verifiedhorses.example",
      name: "Amelia Croft",
      passwordHash: sellerPassword,
      role: "seller",
      sellerType: "private",
      emailVerifiedAt: new Date(),
      idStatus: "verified",
      idVerifiedAt: new Date("2026-02-02T00:00:00Z"),
      county: "North Yorkshire",
      postcode: "YO7",
      isDemo: true,
      referralCode: "amelia",
      bio: "Example seller. Amelia is not a real person.",
    },
  });
  const daniel = await prisma.user.create({
    data: {
      email: "daniel@verifiedhorses.example",
      name: "Daniel Okonkwo",
      passwordHash: sellerPassword,
      role: "seller",
      emailVerifiedAt: new Date(),
      idStatus: "verified",
      idVerifiedAt: new Date("2026-01-18T00:00:00Z"),
      county: "North Yorkshire",
      postcode: "HG4",
      isDemo: true,
      referralCode: "daniel",
      bio: "Example seller. Daniel is not a real person.",
    },
  });
  const priya = await prisma.user.create({
    data: {
      email: "priya@verifiedhorses.example",
      name: "Priya Shah",
      passwordHash: sellerPassword,
      role: "seller",
      emailVerifiedAt: new Date(),
      idStatus: "none",
      county: "North Yorkshire",
      postcode: "YO17",
      isDemo: true,
      referralCode: "priya",
      bio: "Example seller who has not completed an identity check.",
    },
  });
  const buyer = await prisma.user.create({
    data: {
      email: "buyer@verifiedhorses.example",
      name: "Sam Whitfield",
      passwordHash: buyerPassword,
      role: "buyer",
      emailVerifiedAt: new Date(),
      county: "North Yorkshire",
      postcode: "YO1",
      isDemo: true,
      referralCode: "sam",
    },
  });

  const bella = await createHorse(amelia.id, {
    slug: "bella-thirsk-example",
    horseName: "Bella",
    type: "horse",
    breed: "Cob x Thoroughbred",
    ageYears: 9,
    heightInches: 62,
    colour: "Bay",
    sex: "Mare",
    level: "Hacking",
    suits: "Confident adult",
    pricePence: 650000,
    outcode: "YO7",
    description:
      "Example advert. Bella is a made-up 15.2hh bay mare, advertised so you can click through a video-first listing. She is not for sale. A real advert would carry the seller's own words, a riding video, and the vetting papers they choose to share.",
    clips: "walk,trot,canter,jump",
    duration: 48,
    views: 128,
    documents: [
      ["vetting", "2026-03-12"],
      ["xrays", "2026-03-12"],
      ["passport", "2024-06-01"],
      ["microchip", "2024-06-01"],
    ],
    traits: [
      ["hack", "yes"],
      ["load", "yes"],
      ["clip", "yes"],
      ["shoe", "yes"],
      ["box", "yes"],
      ["traffic", "yes"],
      ["horses", "yes"],
      ["dogs", "yes"],
      ["children", "unsure"],
    ],
    publishedAt: new Date("2026-11-20T09:00:00Z"),
  });
  await createHorse(daniel.id, {
    slug: "murphy-ripon-example",
    horseName: "Murphy",
    type: "cob",
    breed: "Cob",
    ageYears: 11,
    heightInches: 57,
    colour: "Bay",
    sex: "Gelding",
    level: "Hacking",
    suits: "Happy hacker",
    pricePence: 320000,
    outcode: "HG4",
    description:
      "Example advert. Murphy is a made-up 14.1hh cob. The X-ray badge is example data, not a real veterinary file. Come and see a real horse before you even think about money.",
    clips: "walk,trot,canter",
    duration: 72,
    views: 86,
    documents: [["xrays", "2026-01-20"]],
    traits: [
      ["hack", "yes"],
      ["load", "yes"],
      ["clip", "no"],
      ["traffic", "yes"],
      ["horses", "yes"],
    ],
    publishedAt: new Date("2026-11-18T09:00:00Z"),
  });
  await createHorse(amelia.id, {
    slug: "ness-malton-example",
    horseName: "Ness",
    type: "pony",
    breed: "Welsh Section B",
    ageYears: 8,
    heightInches: 53,
    colour: "Dun",
    sex: "Mare",
    level: "Novice",
    suits: "Child",
    pricePence: 280000,
    outcode: "YO17",
    description:
      "Example advert. Ness is a made-up 13.1hh dun pony. Nothing on this card is a real pony, a real price, or a real seller.",
    clips: "walk,trot,hacking",
    duration: 55,
    views: 64,
    documents: [["passport", "2023-04-02"]],
    traits: [
      ["hack", "yes"],
      ["load", "yes"],
      ["children", "yes"],
      ["traffic", "yes"],
    ],
    publishedAt: new Date("2026-11-16T09:00:00Z"),
  });
  await createHorse(amelia.id, {
    slug: "captain-northallerton-example",
    horseName: "Captain",
    type: "horse",
    breed: "Irish Sport Horse",
    ageYears: 7,
    heightInches: 64,
    colour: "Chestnut",
    sex: "Gelding",
    level: "Intermediate",
    suits: "Competition",
    pricePence: 875000,
    outcode: "DL6",
    description:
      "Example advert. Captain is a made-up 16hh Irish Sport Horse on the PLUS tier, so the card carries a PLUS badge and sits higher in search. He is not for sale.",
    clips: "walk,trot,canter,jump",
    duration: 90,
    views: 40,
    featured: true,
    tierSlug: "plus",
    documents: [["vetting", "2026-09-01"]],
    traits: [
      ["hack", "yes"],
      ["load", "yes"],
      ["jump", "yes"],
      ["clip", "yes"],
      ["traffic", "yes"],
    ],
    publishedAt: new Date("2026-11-12T09:00:00Z"),
  });
  await createHorse(daniel.id, {
    slug: "bramble-bedale-example",
    horseName: "Bramble",
    type: "youngstock",
    breed: "Thoroughbred",
    ageYears: 0,
    ageMonths: 8,
    heightInches: 56,
    colour: "Bay",
    sex: "Colt",
    level: "Unbacked",
    suits: "",
    pricePence: 150000,
    outcode: "DL8",
    description:
      "Example advert. Bramble is a made-up eight-month-old colt. A real youngstock advert must be honest about weaning, handling and passport status. This one is demonstration data only.",
    clips: "stable,walk",
    duration: 30,
    views: 22,
    tierSlug: "youngstock",
    documents: [["passport", "2026-04-01"]],
    traits: [["catch", "yes"], ["stable", "yes"]],
    publishedAt: new Date("2026-11-10T09:00:00Z"),
  });
  await createHorse(amelia.id, {
    slug: "york-horsebox-example",
    horseName: "3.5 tonne horsebox",
    type: "horsebox",
    breed: "3.5 tonne",
    ageYears: 8,
    heightInches: 0,
    colour: "",
    sex: "",
    level: "",
    suits: "",
    pricePence: 1250000,
    outcode: "YO1",
    description:
      "Example advert. This horsebox is made up. A real advert would show a walk-round video, the payload, and the service history. Do not treat this price as a guide.",
    clips: "walk",
    duration: 40,
    views: 15,
    tierSlug: "transport",
    documents: [],
    traits: [],
    publishedAt: new Date("2026-11-08T09:00:00Z"),
  });
  await createHorse(daniel.id, {
    slug: "dales-transport-example",
    horseName: "Dales horse transport",
    type: "transport",
    breed: "",
    ageYears: 0,
    heightInches: 0,
    colour: "",
    sex: "",
    level: "",
    suits: "",
    pricePence: 18000,
    outcode: "YO7",
    description:
      "Example advert. A made-up local transport service with a guide price of £180. There is no booking, and VerifiedHorses does not arrange transport.",
    clips: "loading",
    duration: 20,
    views: 9,
    tierSlug: "transport",
    documents: [],
    traits: [],
    publishedAt: new Date("2026-11-05T09:00:00Z"),
  });
  await createHorse(amelia.id, {
    slug: "heather-harrogate-sold-example",
    horseName: "Heather",
    type: "horse",
    breed: "Cob",
    ageYears: 12,
    heightInches: 60,
    colour: "Grey",
    sex: "Mare",
    level: "Hacking",
    suits: "Novice",
    pricePence: 450000,
    outcode: "HG1",
    description:
      "Example sold advert. Heather is made up. Sold pages stay online so buyers can see that a listing ended, and so a later price check has something to count. This sale did not happen.",
    clips: "walk,trot",
    duration: 36,
    views: 210,
    documents: [["vetting", "2025-11-02"]],
    traits: [["hack", "yes"], ["load", "yes"], ["clip", "yes"]],
    publishedAt: new Date("2026-01-15T09:00:00Z"),
    status: "sold",
    soldAt: new Date("2026-03-01T00:00:00Z"),
    soldPricePence: 420000,
    showSoldPrice: true,
  });
  await createHorse(priya.id, {
    slug: "mist-malton-unverified-example",
    horseName: "Mist",
    type: "horse",
    breed: "Connemara",
    ageYears: 6,
    heightInches: 58,
    colour: "Grey",
    sex: "Mare",
    level: "Novice",
    suits: "First horse",
    pricePence: 375000,
    outcode: "YO17",
    description:
      "Example advert from a seller who has not completed an identity check. The default search hides it. Turn off “ID-verified sellers” to see how that filter works. Mist is not a real horse.",
    clips: "walk,trot",
    duration: 44,
    views: 4,
    documents: [],
    traits: [["hack", "yes"]],
    publishedAt: new Date("2026-11-21T09:00:00Z"),
  });
  await createHorse(amelia.id, {
    slug: "rowan-pending-example",
    horseName: "Rowan",
    type: "horse",
    breed: "Thoroughbred",
    ageYears: 5,
    heightInches: 64,
    colour: "Bay",
    sex: "Gelding",
    level: "Schooling",
    suits: "Confident adult",
    pricePence: 500000,
    outcode: "YO7",
    description:
      "Example advert waiting in the moderation queue. It is not on the public search. Rowan is made up, like every other horse in this staging set.",
    clips: "walk,trot,canter",
    duration: 50,
    views: 0,
    documents: [],
    traits: [],
    status: "pending",
  });

  const flagged = analyseMessage(
    "Is Bella still for sale? Please WhatsApp me and I can send a deposit before viewing.",
    true,
  );
  const thread = await prisma.thread.create({
    data: {
      advertId: bella.id,
      buyerId: buyer.id,
      sellerId: amelia.id,
      messages: {
        create: {
          advertId: bella.id,
          fromUserId: buyer.id,
          toUserId: amelia.id,
          body: "Is Bella still for sale? Please WhatsApp me and I can send a deposit before viewing.",
          redacted: flagged.redacted,
          scamFlags: flagged.flags.join(","),
          flagged: flagged.flags.length > 0,
        },
      },
    },
  });
  await prisma.report.create({
    data: {
      advertId: bella.id,
      reporterId: buyer.id,
      reason: "other",
      details: "Example report, so the moderation queue is not empty on a fresh staging site. Nothing here needs a real decision.",
      status: "open",
    },
  });
  await prisma.botEvent.create({
    data: {
      type: "report.created",
      payload: JSON.stringify({ example: true, threadId: thread.id }),
      status: "pending",
    },
  });
  await prisma.savedSearch.create({
    data: {
      userId: buyer.id,
      name: "Cobs near York",
      filters: JSON.stringify({ type: "cob", where: "YO1", radius: "40", verified: "1", video: "1" }),
      alerts: true,
      lastNotifiedAt: new Date(),
      unsubscribeToken: newToken(),
    },
  });
  console.log("Seeded example horses, sellers and a buyer. They are clearly marked as example data.");
}

type HorseInput = {
  slug: string;
  horseName: string;
  type: string;
  breed: string;
  ageYears: number;
  ageMonths?: number;
  heightInches: number;
  colour: string;
  sex: string;
  level: string;
  suits: string;
  pricePence: number;
  outcode: string;
  description: string;
  clips: string;
  duration: number;
  views: number;
  documents: Array<[string, string]>;
  traits: Array<[string, string]>;
  publishedAt?: Date;
  status?: string;
  featured?: boolean;
  tierSlug?: string;
  soldAt?: Date;
  soldPricePence?: number;
  showSoldPrice?: boolean;
};

async function createHorse(sellerId: string, input: HorseInput) {
  const prisma = await db();
  const located = place(input.outcode);
  return prisma.advert.create({
    data: {
      sellerId,
      slug: input.slug,
      horseName: input.horseName,
      title: input.horseName,
      type: input.type,
      breed: input.breed,
      ageYears: input.ageYears,
      ageMonths: input.ageMonths || 0,
      heightInches: input.heightInches,
      colour: input.colour,
      sex: input.sex,
      level: input.level,
      suits: input.suits,
      pricePence: input.pricePence,
      outcode: located.outcode,
      postcode: located.outcode,
      town: located.town,
      county: located.county,
      region: located.region,
      lat: located.lat,
      lng: located.lng,
      description: input.description,
      clips: input.clips,
      status: input.status || "live",
      isDemo: true,
      featured: Boolean(input.featured),
      views: input.views,
      tierSlug: input.tierSlug || "standard",
      paidAt: new Date(),
      publishedAt: input.publishedAt,
      soldAt: input.soldAt,
      soldPricePence: input.soldPricePence,
      showSoldPrice: Boolean(input.showSoldPrice),
      videos: {
        create: {
          status: "example",
          durationSec: input.duration,
          clips: input.clips,
        },
      },
      documents: {
        create: input.documents.map(([kind, issued]) => ({
          kind,
          issuedOn: new Date(`${issued}T00:00:00Z`),
          visibility: "logged_in",
          microchip: kind === "microchip" ? "977200009999999" : "",
        })),
      },
      traits: { create: input.traits.map(([key, value]) => ({ key, value })) },
    },
  });
}
