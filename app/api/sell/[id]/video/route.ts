import { redirect } from "next/navigation";
import { ownedAdvert } from "@/lib/owned";
import { sniff, saveUpload } from "@/lib/files";
import { videoUploadsEnabled } from "@/lib/config";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!videoUploadsEnabled()) return new Response("Video uploads are switched off.", { status: 404 });
  const { id } = await context.params;
  const owned = await ownedAdvert(id);
  if ("error" in owned) redirect("/login");
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) redirect(`/sell/${id}/video?error=file`);
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > 80 * 1024 * 1024) redirect(`/sell/${id}/video?error=size`);
  const kind = sniff(buf);
  if (kind !== "mp4" && kind !== "webm") redirect(`/sell/${id}/video?error=type`);
  const stored = saveUpload("videos", buf, kind);
  await owned.prisma.video.create({
    data: {
      advertId: id,
      status: "ready",
      playbackPath: stored,
      durationSec: 0,
      clips: owned.advert.clips,
    },
  });
  redirect(`/sell/${id}/video?uploaded=1`);
}
