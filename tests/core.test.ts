import { describe, expect, it } from "vitest";
import { formatAge, formatDate, formatHeight, formatPrice, parseHands, poundsToPence } from "../lib/format";
import { analyseMessage } from "../lib/scam";
import { defaultFilters, matchesAdvert, shouldIndexLanding, type SearchableAdvert } from "../lib/search";
import { milesBetween, lookupPlace } from "../lib/places";
import { PRICING_DEFAULTS, defaultTierForType } from "../lib/pricing";
import { draftDescription } from "../lib/description";
import { PLATFORM_DISCLAIMER } from "../lib/constants";
import { hashPassword, verifyPassword } from "../lib/password";
import { embedStatusFromHttp, parseVideoUrl } from "../lib/video-links";
import fs from "node:fs";

describe("UK formatting", () => {
  it("formats pounds, dates and hands", () => {
    expect(formatPrice(2900)).toBe("£29");
    expect(formatPrice(650000)).toBe("£6,500");
    expect(formatPrice(1950)).toBe("£19.50");
    expect(formatDate("2026-03-12T00:00:00Z")).toBe("12/03/2026");
    expect(formatHeight(62)).toBe("15.2hh");
    expect(formatHeight(57)).toBe("14.1hh");
    expect(parseHands("15.2")).toBe(62);
    expect(parseHands("15.4")).toBeNull();
    expect(formatAge(0, 8)).toBe("8 months");
    expect(poundsToPence("6,500")).toBe(650000);
  });
});

describe("trust rules", () => {
  it("flags deposits and hides contact details on a first message", () => {
    const result = analyseMessage("WhatsApp me on 07700900123 or sam@example.com and send a deposit before viewing.", true);
    expect(result.flags).toContain("deposit");
    expect(result.flags).toContain("offsite");
    expect(result.flags).toContain("contact-details");
    expect(result.redacted).not.toContain("07700900123");
    expect(result.redacted).not.toContain("sam@example.com");
  });

  it("leaves a normal question alone", () => {
    const result = analyseMessage("Could I come and see her hack this weekend?", true);
    expect(result.flags).toEqual([]);
    expect(result.redacted).toContain("hack");
  });
});

describe("search", () => {
  const bella: SearchableAdvert = {
    id: "1",
    slug: "bella",
    type: "horse",
    breed: "Cob x Thoroughbred",
    pricePence: 650000,
    ageYears: 9,
    heightInches: 62,
    suits: "Confident adult",
    level: "Hacking",
    sex: "Mare",
    county: "North Yorkshire",
    region: "Yorkshire and the Humber",
    town: "Thirsk",
    outcode: "YO7",
    lat: 54.233,
    lng: -1.343,
    status: "live",
    sellerVerified: true,
    hasVideo: true,
    featured: false,
    publishedAt: "2026-11-20T09:00:00.000Z",
  };

  it("defaults to verified sellers with video and matches a cob near York", () => {
    const filters = defaultFilters({ type: "cob", where: "YO1", radius: "40" });
    expect(filters.verified).toBe(true);
    expect(filters.video).toBe(true);
    const origin = lookupPlace("YO1");
    expect(origin?.town).toBe("York");
    const hit = matchesAdvert(bella, filters, origin);
    expect(hit).not.toBeNull();
    expect(hit!.miles).toBeLessThan(40);
    expect(milesBetween(53.959, -1.082, 54.233, -1.343)).toBeGreaterThan(10);
  });

  it("can turn the defaults off", () => {
    const filters = defaultFilters({ verified: "0", video: "0" });
    expect(filters.verified).toBe(false);
    expect(filters.video).toBe(false);
  });

  it("hides an unverified seller while the default is on", () => {
    const filters = defaultFilters({});
    expect(matchesAdvert({ ...bella, sellerVerified: false }, filters, null)).toBeNull();
  });

  it("indexes a landing page only with enough live adverts, and never while staging", () => {
    expect(shouldIndexLanding(3, true)).toBe(true);
    expect(shouldIndexLanding(2, true)).toBe(false);
    expect(shouldIndexLanding(10, false)).toBe(false);
  });
});

describe("pricing and copy", () => {
  it("seeds the prices Steve asked for, as placeholders he can change", () => {
    const bySlug = Object.fromEntries(PRICING_DEFAULTS.map((tier) => [tier.slug, tier.pricePence]));
    expect(bySlug.standard).toBe(2900);
    expect(bySlug.plus).toBe(3900);
    expect(bySlug.youngstock).toBe(1900);
    expect(bySlug.transport).toBe(4500);
    expect(bySlug.trade).toBe(5900);
    expect(defaultTierForType("youngstock")).toBe("youngstock");
    expect(defaultTierForType("horsebox")).toBe("transport");
  });

  it("drafts a description in UK English and states the platform limit", () => {
    const text = draftDescription({
      horseName: "Bella",
      type: "horse",
      breed: "Cob x Thoroughbred",
      ageYears: 9,
      ageMonths: 0,
      heightInches: 62,
      colour: "Bay",
      sex: "Mare",
      level: "Hacking",
      suits: "Confident adult",
      town: "Thirsk",
      county: "North Yorkshire",
      pricePence: 650000,
      traits: [{ key: "hack", value: "yes" }, { key: "load", value: "yes" }],
    });
    expect(text).toContain("Thirsk");
    expect(text).toContain("15.2hh");
    expect(text).toContain("not part of the sale");
  });

  it("keeps the disclaimer in the terms", () => {
    const terms = fs.readFileSync("app/legal/terms/page.tsx", "utf8");
    expect(PLATFORM_DISCLAIMER).toMatch(/listings platform only/);
    expect(PLATFORM_DISCLAIMER).toMatch(/no warranty/);
    expect(PLATFORM_DISCLAIMER).toMatch(/own vetting/);
    expect(terms).toContain("PLATFORM_DISCLAIMER");
    expect(fs.readFileSync("app/legal/privacy/page.tsx", "utf8")).toMatch(/UK GDPR/);
  });
});

describe("video links", () => {
  it("reads YouTube watch, short and Shorts links, and Vimeo links", () => {
    const watch = parseVideoUrl("https://www.youtube.com/watch?v=5ls8QsgClYc&t=12s");
    const short = parseVideoUrl("https://youtu.be/5ls8QsgClYc");
    const shorts = parseVideoUrl("https://www.youtube.com/shorts/5ls8QsgClYc");
    const vimeo = parseVideoUrl("https://vimeo.com/76979871");
    expect(watch?.id).toBe("5ls8QsgClYc");
    expect(short?.id).toBe("5ls8QsgClYc");
    expect(shorts?.provider).toBe("youtube");
    expect(watch?.embedUrl).toBe("https://www.youtube-nocookie.com/embed/5ls8QsgClYc?rel=0");
    expect(watch?.posterUrl).toBe("https://i.ytimg.com/vi/5ls8QsgClYc/hqdefault.jpg");
    expect(vimeo?.provider).toBe("vimeo");
    expect(vimeo?.id).toBe("76979871");
    expect(vimeo?.embedUrl).toContain("player.vimeo.com/video/76979871");
    expect(parseVideoUrl("https://example.com/watch?v=5ls8QsgClYc")).toBeNull();
    expect(parseVideoUrl("not a link")).toBeNull();
  });

  it("maps YouTube oEmbed failures onto private, unavailable and embedding-off", () => {
    expect(embedStatusFromHttp(200)).toBe("ok");
    expect(embedStatusFromHttp(401)).toBe("embed_disabled");
    expect(embedStatusFromHttp(403)).toBe("private");
    expect(embedStatusFromHttp(404)).toBe("unavailable");
    expect(embedStatusFromHttp(500)).toBe("unchecked");
  });
});

describe("passwords", () => {
  it("hashes and checks a password", async () => {
    const hash = await hashPassword("Demo-seller-1");
    expect(await verifyPassword("Demo-seller-1", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });
});
