import { ownedAdvert } from "@/lib/owned";
import { videoServiceConfigured } from "@/lib/config";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const owned = await ownedAdvert(id);
  if ("error" in owned) return Response.json({ error: owned.error }, { status: 401 });
  if (!videoServiceConfigured()) return Response.json({ mode: "local" });
  const response = await fetch(`${process.env.VIDEO_SERVICE_URL!.replace(/\/$/, "")}/v1/grants`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.VIDEO_API_TOKEN}` },
  });
  if (!response.ok) return Response.json({ error: "video service" }, { status: 502 });
  const grant = (await response.json()) as { id: string; uploadToken: string };
  await owned.prisma.video.create({
    data: { advertId: id, remoteId: grant.id, status: "processing", clips: owned.advert.clips },
  });
  const publicBase = (process.env.VIDEO_PUBLIC_URL || process.env.VIDEO_SERVICE_URL || "").replace(/\/$/, "");
  return Response.json({
    mode: "remote",
    videoId: grant.id,
    uploadToken: grant.uploadToken,
    uploadUrl: `${publicBase}/v1/videos/${grant.id}`,
  });
}
