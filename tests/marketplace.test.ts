import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { afterAll, beforeAll, expect, it } from "vitest";

process.env.DATABASE_URL = "file:./data/test-marketplace.db";
process.env.SEED_DEMO = "true";
process.env.ADMIN_INITIAL_PASSWORD = "Demo-admin-1";
process.env.ADMIN_API_TOKEN = "test-admin-token";
process.env.CRON_SECRET = "test-cron-secret";
process.env.STRIPE_SECRET_KEY = "";
process.env.AUTH_SECRET = "test-secret-test-secret-test-secret-ok";

beforeAll(async () => {
  fs.rmSync("data/test-marketplace.db", { force: true });
  execFileSync(process.execPath, ["scripts/prisma.cjs", "migrate", "deploy"], {
    env: process.env,
    stdio: "inherit",
  });
  const { seedIfEmpty } = await import("../lib/seed");
  await seedIfEmpty();
  await seedIfEmpty();
});

afterAll(async () => {
  const { db } = await import("../lib/prisma");
  const prisma = await db();
  await prisma.$disconnect();
});

it("seeds example horses and the placeholder prices once", async () => {
  const { db } = await import("../lib/prisma");
  const prisma = await db();
  const tiers = await prisma.pricingTier.findMany();
  const prices = Object.fromEntries(tiers.map((tier) => [tier.slug, tier.pricePence]));
  expect(prices.standard).toBe(2900);
  expect(prices.plus).toBe(3900);
  expect(await prisma.user.count({ where: { isDemo: true } })).toBe(4);
  const bella = await prisma.advert.findUnique({ where: { slug: "bella-thirsk-example" }, include: { documents: true, videos: true } });
  expect(bella?.isDemo).toBe(true);
  expect(bella?.videos[0]?.status).toBe("example");
  expect(bella?.documents.some((document) => document.kind === "vetting")).toBe(true);
});

it("search hides the unverified example until the filter is turned off", async () => {
  const { searchCatalogue } = await import("../lib/catalogue");
  const { defaultFilters } = await import("../lib/search");
  const verified = await searchCatalogue(defaultFilters({ where: "YO1", radius: "80" }));
  expect(verified.pageItems.some((item) => item.advert.slug === "mist-malton-unverified-example")).toBe(false);
  expect(verified.pageItems.some((item) => item.advert.slug === "bella-thirsk-example")).toBe(true);
  const wider = await searchCatalogue(defaultFilters({ where: "YO1", radius: "80", verified: "0" }));
  expect(wider.pageItems.some((item) => item.advert.slug === "mist-malton-unverified-example")).toBe(true);
});

it("lets the bot approve a pending advert and refuses a missing token", async () => {
  const { handleAdmin } = await import("../lib/admin-api");
  const { db } = await import("../lib/prisma");
  const prisma = await db();
  const pending = await prisma.advert.findFirst({ where: { status: "pending" } });
  expect(pending?.slug).toBe("rowan-pending-example");
  const denied = await handleAdmin("POST", ["adverts", pending!.id, "approve"], {}, null);
  expect(denied.status).toBe(401);
  const approved = await handleAdmin("POST", ["adverts", pending!.id, "approve"], {}, "Bearer test-admin-token");
  expect(approved.status).toBe(200);
  const again = await prisma.advert.findUnique({ where: { id: pending!.id } });
  expect(again?.status).toBe("live");
});

it("emails a saved search from the cron job", async () => {
  const { db } = await import("../lib/prisma");
  const { runAlerts } = await import("../lib/cron-jobs");
  const { cronAuthorised } = await import("../lib/cron-jobs");
  const prisma = await db();
  expect(cronAuthorised(null, null)).toBe(false);
  expect(cronAuthorised("Bearer test-cron-secret", null)).toBe(true);
  await prisma.savedSearch.updateMany({ data: { lastNotifiedAt: new Date("2020-01-01T00:00:00Z") } });
  const result = await runAlerts();
  expect(result.emails).toBeGreaterThan(0);
  const mail = await prisma.outboxEmail.findFirst({ where: { kind: "saved-search" } });
  expect(mail?.body).toContain("/alerts/unsubscribe?token=");
  expect(mail?.subject).toMatch(/new advert/);
});

it("demo payment does not call Stripe when no key is set", async () => {
  const { db } = await import("../lib/prisma");
  const { demoPayAdvert } = await import("../lib/payments");
  const prisma = await db();
  const seller = await prisma.user.findUnique({ where: { email: "amelia@verifiedhorses.example" } });
  const draft = await prisma.advert.create({
    data: {
      sellerId: seller!.id,
      slug: "draft-payment-test",
      type: "horse",
      status: "draft",
      pricePence: 100000,
      town: "Thirsk",
      county: "North Yorkshire",
      description: "A long enough description for the submit rules to accept this draft during the test.",
      videos: { create: { status: "ready", durationSec: 10 } },
    },
  });
  const result = await demoPayAdvert(seller!.id, draft.id, "standard");
  expect(result.ok).toBe(true);
  const stored = await prisma.advert.findUnique({ where: { id: draft.id } });
  expect(stored?.status).toBe("pending");
  expect(stored?.paidAt).not.toBeNull();
});
