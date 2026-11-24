"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "../current-user";
import { approveAdvert, banUser, rejectAdvert, removeAdvert, resolveReport } from "../moderation";
import { db } from "../prisma";
import { poundsToPence } from "../format";

function actor(id: string) {
  return { type: "admin" as const, id };
}

export async function adminApprove(formData: FormData) {
  const admin = await requireAdmin();
  await approveAdvert(String(formData.get("id")), actor(admin.id));
  redirect("/admin?done=approved");
}

export async function adminReject(formData: FormData) {
  const admin = await requireAdmin();
  await rejectAdvert(String(formData.get("id")), String(formData.get("note") || ""), actor(admin.id));
  redirect("/admin?done=rejected");
}

export async function adminRemove(formData: FormData) {
  const admin = await requireAdmin();
  await removeAdvert(String(formData.get("id")), String(formData.get("note") || ""), actor(admin.id));
  redirect("/admin?done=removed");
}

export async function adminBan(formData: FormData) {
  const admin = await requireAdmin();
  await banUser(String(formData.get("id")), String(formData.get("note") || ""), actor(admin.id));
  redirect("/admin?done=banned");
}

export async function adminReport(formData: FormData) {
  const admin = await requireAdmin();
  const status = String(formData.get("status")) === "dismissed" ? "dismissed" : "actioned";
  await resolveReport(String(formData.get("id")), status, String(formData.get("note") || ""), actor(admin.id));
  redirect("/admin?done=report");
}

export async function adminPrice(formData: FormData) {
  await requireAdmin();
  const slug = String(formData.get("slug") || "");
  const price = poundsToPence(String(formData.get("price") || ""));
  if (price === null) redirect("/admin/pricing?error=price");
  const prisma = await db();
  await prisma.pricingTier.update({
    where: { slug },
    data: {
      pricePence: price,
      active: formData.get("active") === "on",
      description: String(formData.get("description") || "").slice(0, 1000),
    },
  });
  redirect("/admin/pricing?saved=1");
}

export async function adminFreeListings(formData: FormData) {
  await requireAdmin();
  const prisma = await db();
  await prisma.setting.upsert({
    where: { key: "listings_free" },
    update: { value: formData.get("listings_free") === "on" ? "true" : "false" },
    create: { key: "listings_free", value: formData.get("listings_free") === "on" ? "true" : "false" },
  });
  redirect("/admin/pricing?saved=1");
}

export async function adminClearDemo() {
  const admin = await requireAdmin();
  const prisma = await db();
  await prisma.user.deleteMany({ where: { isDemo: true } });
  await prisma.auditLog.create({
    data: { actorId: admin.id, actorType: "admin", action: "demo.cleared", detail: "Removed example users and their adverts." },
  });
  redirect("/admin?done=demo");
}
