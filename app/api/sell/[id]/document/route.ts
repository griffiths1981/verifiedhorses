import { redirect } from "next/navigation";
import { ownedAdvert } from "@/lib/owned";
import { sniff, saveUpload } from "@/lib/files";
import { DOC_KINDS } from "@/lib/constants";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const owned = await ownedAdvert(id);
  if ("error" in owned) redirect("/login");
  const form = await request.formData();
  const kind = String(form.get("kind") || "");
  if (!DOC_KINDS.some((item) => item[0] === kind)) redirect(`/sell/${id}/documents?error=kind`);
  const issued = String(form.get("issued") || "");
  const issuedOn = /^\d{4}-\d{2}-\d{2}$/.test(issued) ? new Date(`${issued}T00:00:00Z`) : null;
  if (!issuedOn || Number.isNaN(issuedOn.getTime())) redirect(`/sell/${id}/documents?error=date`);
  const visibility = form.get("visibility") === "on_request" ? "on_request" : "logged_in";
  const microchip = String(form.get("microchip") || "").replace(/[^\d]/g, "").slice(0, 20);
  let stored = "";
  let filename = "";
  const file = form.get("file");
  if (file instanceof File && file.size > 0) {
    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length > 10 * 1024 * 1024) redirect(`/sell/${id}/documents?error=size`);
    const sniffed = sniff(buf);
    if (sniffed !== "pdf" && sniffed !== "jpeg" && sniffed !== "png" && sniffed !== "webp") redirect(`/sell/${id}/documents?error=type`);
    stored = saveUpload("documents", buf, sniffed);
    filename = file.name.slice(0, 180);
  }
  await owned.prisma.document.create({
    data: { advertId: id, kind, issuedOn, visibility, storagePath: stored, filename, microchip },
  });
  redirect(`/sell/${id}/documents?saved=1`);
}
