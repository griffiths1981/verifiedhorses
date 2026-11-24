import { db } from "./prisma";
import { audit, recordEvent } from "./events";
import { enqueueEmail } from "./mail";
import { baseUrl } from "./config";

export type Actor = { id?: string; type: "admin" | "bot" | "system" };

export async function approveAdvert(id: string, actor: Actor) {
  const prisma = await db();
  const advert = await prisma.advert.findUnique({ where: { id }, include: { seller: true } });
  if (!advert) return { ok: false as const, error: "not_found" };
  if (advert.status === "removed") return { ok: false as const, error: "removed" };
  await prisma.advert.update({
    where: { id },
    data: { status: "live", publishedAt: advert.publishedAt ?? new Date(), rejectionNote: "" },
  });
  await audit({ actor, action: "advert.approved", targetType: "advert", targetId: id });
  await enqueueEmail({
    to: advert.seller.email,
    kind: "advert-approved",
    subject: "Your VerifiedHorses advert is live",
    body: `Your advert is now live: ${baseUrl()}/horses/${advert.slug}\n\nVerifiedHorses is a listings platform only. Buyers should arrange their own vetting.`,
  });
  return { ok: true as const };
}

export async function rejectAdvert(id: string, note: string, actor: Actor) {
  const prisma = await db();
  const advert = await prisma.advert.findUnique({ where: { id }, include: { seller: true } });
  if (!advert) return { ok: false as const, error: "not_found" };
  await prisma.advert.update({
    where: { id },
    data: { status: "rejected", rejectionNote: note.slice(0, 2000) },
  });
  await audit({ actor, action: "advert.rejected", targetType: "advert", targetId: id, detail: note });
  await enqueueEmail({
    to: advert.seller.email,
    kind: "advert-rejected",
    subject: "Your VerifiedHorses advert needs changes",
    body: `We have not published this advert.\n\n${note || "Please review it and submit again."}\n\n${baseUrl()}/sell/${advert.id}/preview`,
  });
  return { ok: true as const };
}

export async function removeAdvert(id: string, note: string, actor: Actor) {
  const prisma = await db();
  const advert = await prisma.advert.findUnique({ where: { id } });
  if (!advert) return { ok: false as const, error: "not_found" };
  await prisma.advert.update({
    where: { id },
    data: { status: "removed", rejectionNote: note.slice(0, 2000) },
  });
  await audit({ actor, action: "advert.removed", targetType: "advert", targetId: id, detail: note });
  return { ok: true as const };
}

export async function banUser(id: string, note: string, actor: Actor) {
  const prisma = await db();
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { ok: false as const, error: "not_found" };
  if (user.role === "admin") return { ok: false as const, error: "cannot_ban_admin" };
  await prisma.user.update({ where: { id }, data: { bannedAt: new Date() } });
  await prisma.advert.updateMany({ where: { sellerId: id, status: { in: ["live", "pending", "draft"] } }, data: { status: "removed" } });
  await audit({ actor, action: "user.banned", targetType: "user", targetId: id, detail: note });
  return { ok: true as const };
}

export async function resolveReport(id: string, status: "actioned" | "dismissed", note: string, actor: Actor) {
  const prisma = await db();
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) return { ok: false as const, error: "not_found" };
  await prisma.report.update({ where: { id }, data: { status } });
  await audit({ actor, action: `report.${status}`, targetType: "report", targetId: id, detail: note });
  return { ok: true as const };
}

export async function submitAdvert(id: string, userId: string) {
  const prisma = await db();
  const advert = await prisma.advert.findUnique({ where: { id }, include: { videos: true, seller: true } });
  if (!advert || advert.sellerId !== userId) return { ok: false as const, error: "not_found" };
  if (advert.seller.idStatus !== "verified") return { ok: false as const, error: "identity" };
  if (!advert.videos.length) return { ok: false as const, error: "video" };
  if (advert.description.trim().length < 40) return { ok: false as const, error: "description" };
  if (!advert.town || !advert.county) return { ok: false as const, error: "place" };
  if (advert.pricePence <= 0) return { ok: false as const, error: "price" };
  await prisma.advert.update({ where: { id }, data: { status: "pending" } });
  await recordEvent("advert.submitted", { advertId: id, sellerId: userId, slug: advert.slug });
  return { ok: true as const };
}
