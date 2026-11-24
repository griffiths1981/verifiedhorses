import { db } from "./prisma";
import { deliverQueued, enqueueEmail } from "./mail";
import { defaultFilters, matchesAdvert, type SearchableAdvert } from "./search";
import { lookupPlace } from "./places";
import { advertHeading } from "./description";
import { formatPrice } from "./format";
import { baseUrl } from "./config";
import { safeEqual } from "./tokens";
import { countsAsVideo, embedStatusFromHttp, oEmbedEndpoint } from "./video-links";
import { videoUploadsEnabled } from "./config";
import { recordEvent } from "./events";

export function cronAuthorised(header: string | null, querySecret: string | null): boolean {
  const expected = process.env.CRON_SECRET || "";
  if (!expected) return false;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : "";
  const presented = bearer || querySecret || "";
  return safeEqual(presented, expected);
}

function toSearchable(advert: {
  id: string;
  slug: string;
  type: string;
  breed: string;
  pricePence: number;
  ageYears: number;
  heightInches: number;
  suits: string;
  level: string;
  sex: string;
  county: string;
  region: string;
  town: string;
  outcode: string;
  lat: number;
  lng: number;
  status: string;
  featured: boolean;
  publishedAt: Date | null;
  seller: { idStatus: string };
  videos: { status: string }[];
}): SearchableAdvert {
  return {
    id: advert.id,
    slug: advert.slug,
    type: advert.type,
    breed: advert.breed,
    pricePence: advert.pricePence,
    ageYears: advert.ageYears,
    heightInches: advert.heightInches,
    suits: advert.suits,
    level: advert.level,
    sex: advert.sex,
    county: advert.county,
    region: advert.region,
    town: advert.town,
    outcode: advert.outcode,
    lat: advert.lat,
    lng: advert.lng,
    status: advert.status,
    sellerVerified: advert.seller.idStatus === "verified",
    hasVideo: advert.videos.some((video) => countsAsVideo(video)),
    featured: advert.featured,
    publishedAt: advert.publishedAt?.toISOString() || null,
  };
}

export async function runAlerts() {
  const prisma = await db();
  const searches = await prisma.savedSearch.findMany({ where: { alerts: true }, include: { user: true } });
  const adverts = await prisma.advert.findMany({
    where: { status: "live" },
    include: { seller: true, videos: true },
  });
  const searchable = adverts.map(toSearchable);
  let emails = 0;
  for (const search of searches) {
    const filters = defaultFilters(JSON.parse(search.filters) as Record<string, string>);
    const origin = filters.where ? lookupPlace(filters.where) : null;
    const hits = searchable.filter((advert) => {
      if (advert.publishedAt && advert.publishedAt <= search.lastNotifiedAt.toISOString()) return false;
      return Boolean(matchesAdvert(advert, { ...filters, page: 1 }, origin));
    });
    if (!hits.length) continue;
    const lines = hits.slice(0, 10).map((advert) => {
      const full = adverts.find((item) => item.id === advert.id);
      const title = full ? advertHeading(full) : advert.slug;
      return `- ${title}, ${formatPrice(advert.pricePence)}: ${baseUrl()}/horses/${advert.slug}`;
    });
    await enqueueEmail({
      to: search.user.email,
      kind: "saved-search",
      subject: `${hits.length} new ${hits.length === 1 ? "advert" : "adverts"} for ${search.name}`,
      body: `New adverts matching "${search.name}":\n\n${lines.join("\n")}\n\nTurn these alerts off: ${baseUrl()}/alerts/unsubscribe?token=${search.unsubscribeToken}`,
    });
    await prisma.savedSearch.update({ where: { id: search.id }, data: { lastNotifiedAt: new Date() } });
    emails += 1;
  }
  return { searches: searches.length, emails };
}

export async function runNudges() {
  const prisma = await db();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const drafts = await prisma.advert.findMany({
    where: { status: "draft", nudgedAt: null, updatedAt: { lt: cutoff } },
    include: { seller: true },
    take: 30,
  });
  for (const draft of drafts) {
    await enqueueEmail({
      to: draft.seller.email,
      kind: "draft-nudge",
      subject: "Your VerifiedHorses advert is still a draft",
      body: `You started an advert and have not submitted it.\n\nCarry on here: ${baseUrl()}/sell/${draft.id}/video`,
    });
    await prisma.advert.update({ where: { id: draft.id }, data: { nudgedAt: new Date() } });
  }
  return { nudged: drafts.length };
}

export async function runRetention() {
  const prisma = await db();
  const old = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const tokens = await prisma.emailToken.deleteMany({ where: { OR: [{ usedAt: { lt: old } }, { expiresAt: { lt: old } }] } });
  return { tokens: tokens.count };
}

export async function runSummary() {
  const prisma = await db();
  const [pending, reports, flagged, live] = await Promise.all([
    prisma.advert.count({ where: { status: "pending" } }),
    prisma.report.count({ where: { status: "open" } }),
    prisma.message.count({ where: { flagged: true, readAt: null } }),
    prisma.advert.count({ where: { status: "live" } }),
  ]);
  const to = process.env.CONTACT_EMAIL || "hello@verifiedhorses.example";
  await enqueueEmail({
    to,
    kind: "weekly-summary",
    subject: "VerifiedHorses moderation summary",
    body: `Live adverts: ${live}\nWaiting for review: ${pending}\nOpen reports: ${reports}\nFlagged messages: ${flagged}\n\nQueue: ${baseUrl()}/admin`,
  });
  return { pending, reports, flagged, live };
}

export async function runWebhooks() {
  const prisma = await db();
  const url = process.env.BOT_WEBHOOK_URL;
  if (!url) return { delivered: 0, skipped: true };
  const rows = await prisma.botEvent.findMany({ where: { status: "pending" }, take: 20 });
  let delivered = 0;
  for (const row of rows) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-verifiedhorses-secret": process.env.BOT_WEBHOOK_SECRET || "",
        },
        body: JSON.stringify({ id: row.id, type: row.type, payload: JSON.parse(row.payload) }),
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        await prisma.botEvent.update({ where: { id: row.id }, data: { status: "delivered", deliveredAt: new Date() } });
        delivered += 1;
      }
    } catch {
      // Leave it pending.
    }
  }
  return { delivered, skipped: false };
}

export async function runVideoChecks(fetchImpl: typeof fetch = fetch) {
  const prisma = await db();
  const due = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const videos = await prisma.video.findMany({
    where: {
      provider: { in: ["youtube", "vimeo"] },
      remoteId: { not: "" },
      OR: [{ checkedAt: null }, { checkedAt: { lt: due } }, { embedStatus: "unchecked" }],
    },
    take: 40,
  });
  let checked = 0;
  let flagged = 0;
  for (const video of videos) {
    const canonical = video.playbackPath || (video.provider === "vimeo" ? `https://vimeo.com/${video.remoteId}` : `https://www.youtube.com/watch?v=${video.remoteId}`);
    const endpoint = oEmbedEndpoint({ provider: video.provider, canonicalUrl: canonical });
    if (!endpoint) continue;
    let status = 0;
    let thumbnail = "";
    try {
      const response = await fetchImpl(endpoint, { signal: AbortSignal.timeout(5000) });
      status = response.status;
      if (response.ok) {
        const body = (await response.json()) as { thumbnail_url?: string };
        thumbnail = body.thumbnail_url || "";
      }
    } catch {
      continue;
    }
    const embedStatus = embedStatusFromHttp(status);
    await prisma.video.update({
      where: { id: video.id },
      data: {
        embedStatus,
        checkedAt: new Date(),
        posterPath: thumbnail || video.posterPath,
      },
    });
    checked += 1;
    if (embedStatus !== "ok" && embedStatus !== "unchecked" && embedStatus !== video.embedStatus) {
      flagged += 1;
      await recordEvent("video.flagged", {
        videoId: video.id,
        advertId: video.advertId,
        provider: video.provider,
        remoteId: video.remoteId,
        url: canonical,
        embedStatus,
      });
    }
  }
  return { checked, flagged };
}

export async function runVideoSync() {
  if (!videoUploadsEnabled()) return { updated: 0, skipped: true };
  const base = process.env.VIDEO_SERVICE_URL;
  const token = process.env.VIDEO_API_TOKEN;
  if (!base || !token) return { updated: 0, skipped: true };
  const prisma = await db();
  const videos = await prisma.video.findMany({ where: { status: "processing", remoteId: { not: "" } }, take: 20 });
  let updated = 0;
  for (const video of videos) {
    try {
      const response = await fetch(`${base.replace(/\/$/, "")}/v1/videos/${video.remoteId}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!response.ok) continue;
      const body = (await response.json()) as { status?: string; playbackUrl?: string; posterUrl?: string; durationSec?: number; error?: string };
      if (body.status === "ready") {
        await prisma.video.update({
          where: { id: video.id },
          data: {
            status: "ready",
            playbackPath: body.playbackUrl || video.playbackPath,
            posterPath: body.posterUrl || video.posterPath,
            durationSec: body.durationSec || video.durationSec,
          },
        });
        updated += 1;
      } else if (body.status === "failed") {
        await prisma.video.update({ where: { id: video.id }, data: { status: "failed" } });
        updated += 1;
      }
    } catch {
      // Try again on the next cron run.
    }
  }
  return { updated };
}

export async function runCron(job: string) {
  if (job === "alerts") return runAlerts();
  if (job === "emails") return deliverQueued();
  if (job === "nudges") return runNudges();
  if (job === "retention") return runRetention();
  if (job === "summary") return runSummary();
  if (job === "webhooks") return runWebhooks();
  if (job === "videos") {
    const checks = await runVideoChecks();
    const uploads = await runVideoSync();
    return { checks, uploads };
  }
  return null;
}
