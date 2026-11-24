import { redirect } from "next/navigation";
import { ownedAdvert } from "@/lib/owned";
import { sniff, saveUpload } from "@/lib/files";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const owned = await ownedAdvert(id);
  if ("error" in owned) redirect("/login");
  const form = await request.formData();
  const file = form.get("file");
  const alt = String(form.get("alt") || "").slice(0, 180);
  if (!(file instanceof File)) redirect(`/sell/${id}/video?error=photo`);
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > 8 * 1024 * 1024) redirect(`/sell/${id}/video?error=size`);
  const kind = sniff(buf);
  if (kind !== "jpeg" && kind !== "png" && kind !== "webp") redirect(`/sell/${id}/video?error=photo`);
  const stored = saveUpload("photos", buf, kind);
  const count = await owned.prisma.photo.count({ where: { advertId: id } });
  await owned.prisma.photo.create({ data: { advertId: id, path: stored, alt: alt || "Horse photo", sortOrder: count } });
  redirect(`/sell/${id}/video?photo=1`);
}
