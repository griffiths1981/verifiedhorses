"use server";

import { redirect } from "next/navigation";
import { db } from "../prisma";
import { currentUser } from "../current-user";
import { analyseMessage } from "../scam";
import { recordEvent } from "../events";
import { enqueueEmail } from "../mail";
import { baseUrl } from "../config";
import { rateLimit } from "../rate-limit";
import { newToken } from "../tokens";

export async function sendEnquiry(formData: FormData) {
  const user = await currentUser();
  const slug = String(formData.get("slug") || "");
  if (!user) redirect(`/login?next=/horses/${slug}`);
  if (!user.emailVerifiedAt) redirect("/verify-email?pending=1");
  const body = String(formData.get("body") || "").trim().slice(0, 4000);
  if (body.length < 10) redirect(`/horses/${slug}?error=short#message`);
  if (!rateLimit(`enquiry:${user.id}`, 20, 60 * 60 * 1000)) redirect(`/horses/${slug}?error=rate#message`);
  const prisma = await db();
  const advert = await prisma.advert.findUnique({ where: { slug }, include: { seller: true } });
  if (!advert || (advert.status !== "live" && advert.status !== "sold")) redirect("/horses");
  if (advert.sellerId === user.id) redirect(`/horses/${slug}?error=own#message`);
  const existing = await prisma.thread.findUnique({ where: { advertId_buyerId: { advertId: advert.id, buyerId: user.id } } });
  const prior = existing ? await prisma.message.count({ where: { threadId: existing.id, fromUserId: user.id } }) : 0;
  const sellerHasReplied = existing
    ? (await prisma.message.count({ where: { threadId: existing.id, fromUserId: advert.sellerId } })) > 0
    : false;
  const mask = prior === 0 || !sellerHasReplied;
  const analysed = analyseMessage(body, user.id !== advert.sellerId && mask);
  const thread =
    existing ||
    (await prisma.thread.create({
      data: { advertId: advert.id, buyerId: user.id, sellerId: advert.sellerId },
    }));
  const message = await prisma.message.create({
    data: {
      threadId: thread.id,
      advertId: advert.id,
      fromUserId: user.id,
      toUserId: user.id === advert.sellerId ? existing?.buyerId || advert.sellerId : advert.sellerId,
      body,
      redacted: analysed.redacted,
      scamFlags: analysed.flags.join(","),
      flagged: analysed.flags.length > 0,
    },
  });
  if (analysed.flags.length) {
    await recordEvent("message.flagged", { messageId: message.id, advertId: advert.id, flags: analysed.flags });
  }
  const recipient = user.id === advert.sellerId ? await prisma.user.findUnique({ where: { id: thread.buyerId } }) : advert.seller;
  if (recipient) {
    await enqueueEmail({
      to: recipient.email,
      kind: "enquiry",
      subject: `New message about ${advert.horseName || "an advert"}`,
      body: `You have a message on VerifiedHorses. Read and reply on the site:\n\n${baseUrl()}/account/messages/${thread.id}\n\nContact details stay on the site until you reply.`,
    });
  }
  redirect(`/account/messages/${thread.id}`);
}

export async function replyToThread(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/account/messages");
  const threadId = String(formData.get("threadId") || "");
  const body = String(formData.get("body") || "").trim().slice(0, 4000);
  if (body.length < 2) redirect(`/account/messages/${threadId}?error=short`);
  const prisma = await db();
  const thread = await prisma.thread.findUnique({ where: { id: threadId }, include: { advert: true } });
  if (!thread || (thread.buyerId !== user.id && thread.sellerId !== user.id)) redirect("/account/messages");
  const sellerReplies = await prisma.message.count({ where: { threadId, fromUserId: thread.sellerId } });
  const fromBuyer = user.id === thread.buyerId;
  const analysed = analyseMessage(body, fromBuyer && sellerReplies === 0);
  const toUserId = fromBuyer ? thread.sellerId : thread.buyerId;
  const message = await prisma.message.create({
    data: {
      threadId,
      advertId: thread.advertId,
      fromUserId: user.id,
      toUserId,
      body,
      redacted: analysed.redacted,
      scamFlags: analysed.flags.join(","),
      flagged: analysed.flags.length > 0,
    },
  });
  if (analysed.flags.length) await recordEvent("message.flagged", { messageId: message.id, advertId: thread.advertId, flags: analysed.flags });
  const recipient = await prisma.user.findUnique({ where: { id: toUserId } });
  if (recipient) {
    await enqueueEmail({
      to: recipient.email,
      kind: "enquiry",
      subject: `Reply about ${thread.advert.horseName || "an advert"}`,
      body: `There is a reply on VerifiedHorses:\n\n${baseUrl()}/account/messages/${threadId}`,
    });
  }
  redirect(`/account/messages/${threadId}`);
}

export async function reportAdvert(formData: FormData) {
  const user = await currentUser();
  const slug = String(formData.get("slug") || "");
  const reason = String(formData.get("reason") || "other").slice(0, 40);
  const details = String(formData.get("details") || "").slice(0, 2000);
  const prisma = await db();
  const advert = await prisma.advert.findUnique({ where: { slug } });
  if (!advert) redirect("/horses");
  if (!rateLimit(`report:${user?.id || "anon"}`, 10, 60 * 60 * 1000)) redirect(`/horses/${slug}?error=rate`);
  await prisma.report.create({
    data: { advertId: advert.id, reporterId: user?.id, reason, details, status: "open" },
  });
  await recordEvent("report.created", { advertId: advert.id, reason, reporterId: user?.id || null });
  redirect(`/horses/${slug}?reported=1`);
}

export async function saveSearch(formData: FormData) {
  const user = await currentUser();
  const back = String(formData.get("back") || "/horses");
  if (!user) redirect(`/login?next=${encodeURIComponent(back)}`);
  const name = String(formData.get("name") || "Saved search").slice(0, 80);
  const filters = String(formData.get("filters") || "{}");
  const prisma = await db();
  await prisma.savedSearch.create({
    data: {
      userId: user.id,
      name,
      filters,
      alerts: formData.get("alerts") === "on",
      unsubscribeToken: newToken(),
    },
  });
  redirect("/account/saved?alerts=1");
}

export async function toggleSave(formData: FormData) {
  const user = await currentUser();
  const slug = String(formData.get("slug") || "");
  if (!user) redirect(`/login?next=/horses/${slug}`);
  const prisma = await db();
  const advert = await prisma.advert.findUnique({ where: { slug } });
  if (!advert) redirect("/horses");
  const existing = await prisma.savedAdvert.findUnique({ where: { userId_advertId: { userId: user.id, advertId: advert.id } } });
  if (existing) await prisma.savedAdvert.delete({ where: { userId_advertId: { userId: user.id, advertId: advert.id } } });
  else await prisma.savedAdvert.create({ data: { userId: user.id, advertId: advert.id } });
  redirect(`/horses/${slug}`);
}

export async function unsubscribeAlert(formData: FormData) {
  const token = String(formData.get("token") || "");
  const prisma = await db();
  await prisma.savedSearch.updateMany({ where: { unsubscribeToken: token }, data: { alerts: false } });
  redirect("/alerts/unsubscribe?done=1");
}
