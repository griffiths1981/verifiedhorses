"use server";

import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { db } from "../prisma";
import { requireUser } from "../current-user";
import { TYPES, TRAITS, CLIPS } from "../constants";
import { defaultTierForType } from "../pricing";
import { lookupPlace } from "../places";
import { poundsToPence, parseHands, slugify } from "../format";
import { draftDescription, socialCaption } from "../description";
import { parseVideoUrl } from "../video-links";
import { createCheckout, demoPayAdvert } from "../payments";
import { baseUrl } from "../config";

async function owned(id: string) {
  const user = await requireUser();
  const prisma = await db();
  const advert = await prisma.advert.findUnique({ where: { id }, include: { traits: true, videos: true } });
  if (!advert || (advert.sellerId !== user.id && user.role !== "admin")) redirect("/account");
  return { user, prisma, advert };
}

export async function startAdvert(formData: FormData) {
  const user = await requireUser();
  if (!user.emailVerifiedAt) redirect("/verify-email?pending=1");
  const type = String(formData.get("type") || "horse");
  if (!TYPES.some((item) => item.slug === type)) redirect("/sell?error=type");
  const prisma = await db();
  if (user.role === "buyer") {
    await prisma.user.update({ where: { id: user.id }, data: { role: "seller" } });
  }
  const advert = await prisma.advert.create({
    data: {
      sellerId: user.id,
      type,
      slug: `draft-${randomBytes(4).toString("hex")}`,
      status: "draft",
      tierSlug: defaultTierForType(type),
    },
  });
  redirect(`/sell/${advert.id}/video`);
}

export async function saveClips(formData: FormData) {
  const id = String(formData.get("id") || "");
  const { prisma } = await owned(id);
  const videoNote = String(formData.get("videoNote") || "").slice(0, 240);
  const links: Array<{ key: string; parsed: NonNullable<ReturnType<typeof parseVideoUrl>> }> = [];
  for (const [key] of CLIPS) {
    const raw = String(formData.get(`link_${key}`) || "").trim();
    if (!raw) continue;
    const parsed = parseVideoUrl(raw);
    if (!parsed) redirect(`/sell/${id}/video?error=link&clip=${key}`);
    links.push({ key, parsed });
  }
  if (!links.length) redirect(`/sell/${id}/video?error=missing`);
  await prisma.video.deleteMany({ where: { advertId: id } });
  await prisma.video.createMany({
    data: links.map((link, index) => ({
      advertId: id,
      provider: link.parsed.provider,
      clipKey: link.key,
      remoteId: link.parsed.id,
      sourceUrl: String(formData.get(`link_${link.key}`) || "").trim().slice(0, 2000),
      playbackPath: link.parsed.canonicalUrl,
      posterPath: link.parsed.posterUrl,
      status: "ready",
      embedStatus: "unchecked",
      clips: link.key,
      sortOrder: index,
    })),
  });
  await prisma.advert.update({
    where: { id },
    data: { clips: links.map((link) => link.key).join(","), videoNote },
  });
  redirect(`/sell/${id}/facts`);
}

export async function saveFacts(formData: FormData) {
  const id = String(formData.get("id") || "");
  const { prisma, advert } = await owned(id);
  const intent = String(formData.get("intent") || "next");
  const type = String(formData.get("type") || advert.type);
  const horseName = String(formData.get("horseName") || "").slice(0, 80);
  const breed = String(formData.get("breed") || "").slice(0, 80);
  const colour = String(formData.get("colour") || "").slice(0, 40);
  const sex = String(formData.get("sex") || "").slice(0, 20);
  const level = String(formData.get("level") || "").slice(0, 40);
  const suits = formData.getAll("suits").map(String).slice(0, 6).join(", ");
  const ageYears = Math.min(45, Math.max(0, Number(formData.get("ageYears") || 0) || 0));
  const ageMonths = Math.min(11, Math.max(0, Number(formData.get("ageMonths") || 0) || 0));
  const heightInches = parseHands(String(formData.get("height") || "")) ?? 0;
  const pricePence = poundsToPence(String(formData.get("price") || "")) ?? 0;
  const negotiable = formData.get("negotiable") === "on";
  const located = lookupPlace(String(formData.get("postcode") || ""));
  const description = String(formData.get("description") || "").slice(0, 8000);
  if (!located) redirect(`/sell/${id}/facts?error=place`);
  if (intent !== "draft-text" && pricePence <= 0) redirect(`/sell/${id}/facts?error=price`);
  const traits: { key: string; value: string }[] = [];
  for (const [key] of TRAITS) {
    const value = String(formData.get(`trait_${key}`) || "");
    if (value === "yes" || value === "no" || value === "unsure") traits.push({ key, value });
  }
  let nextDescription = description;
  if (intent === "draft-text" || (intent === "next" && !description.trim())) {
    nextDescription = draftDescription({
      horseName,
      type,
      breed,
      ageYears,
      ageMonths,
      heightInches,
      colour,
      sex,
      level,
      suits,
      town: located.town,
      county: located.county,
      pricePence,
      traits,
    });
  }
  const slugBase = slugify(`${horseName || type}-${located.town}`) || "advert";
  const slug = advert.slug.startsWith("draft-") ? `${slugBase}-${advert.id.slice(-6)}` : advert.slug;
  await prisma.advert.update({
    where: { id },
    data: {
      type,
      horseName,
      title: horseName || breed || type,
      breed,
      colour,
      sex,
      level,
      suits,
      ageYears,
      ageMonths,
      heightInches,
      pricePence,
      negotiable,
      postcode: String(formData.get("postcode") || "").toUpperCase().slice(0, 12),
      outcode: located.outcode,
      town: located.town,
      county: located.county,
      region: located.region,
      lat: located.lat,
      lng: located.lng,
      description: nextDescription,
      slug,
      tierSlug: advert.tierSlug === "plus" ? "plus" : defaultTierForType(type),
    },
  });
  await prisma.trait.deleteMany({ where: { advertId: id } });
  if (traits.length) {
    await prisma.trait.createMany({
      data: traits.map((trait) => ({ advertId: id, key: trait.key, value: trait.value })),
    });
  }
  if (intent === "draft-text" || intent === "stay") redirect(`/sell/${id}/facts?saved=1`);
  redirect(`/sell/${id}/documents`);
}

export async function saveTierAndPay(formData: FormData) {
  const id = String(formData.get("id") || "");
  const { user, prisma, advert } = await owned(id);
  if (formData.get("honest") !== "on") redirect(`/sell/${id}/preview?error=honest`);
  const tierSlug = String(formData.get("tier") || advert.tierSlug);
  await prisma.advert.update({
    where: { id },
    data: {
      tierSlug,
      socialCaption: socialCaption({
        title: advert.horseName || advert.breed || "Advert",
        town: advert.town,
        pricePence: advert.pricePence,
        url: `${baseUrl()}/horses/${advert.slug}`,
      }),
    },
  });
  if (formData.get("intent") === "demo") {
    const result = await demoPayAdvert(user.id, id, tierSlug);
    redirect(result.ok ? `/sell/${id}/preview?submitted=1` : `/sell/${id}/preview?error=${result.error}`);
  }
  const checkout = await createCheckout({ userId: user.id, email: user.email, tierSlug, advertId: id });
  if (checkout.ok && checkout.mode === "stripe" && checkout.url) redirect(checkout.url);
  if (checkout.ok && checkout.mode === "free") redirect(`/sell/${id}/preview?submitted=1`);
  redirect(`/sell/${id}/preview?error=${"error" in checkout ? checkout.error : "pay"}`);
}

export async function markSold(formData: FormData) {
  const id = String(formData.get("id") || "");
  const { prisma, advert } = await owned(id);
  const show = formData.get("showPrice") === "on";
  const soldPrice = poundsToPence(String(formData.get("soldPrice") || ""));
  await prisma.advert.update({
    where: { id },
    data: {
      status: "sold",
      soldAt: new Date(),
      soldPricePence: soldPrice,
      showSoldPrice: show && soldPrice !== null,
    },
  });
  redirect(`/horses/${advert.slug}?sold=1`);
}
