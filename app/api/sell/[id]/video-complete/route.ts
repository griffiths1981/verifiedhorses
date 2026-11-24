import { ownedAdvert } from "@/lib/owned";
import { videoUploadsEnabled } from "@/lib/config";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!videoUploadsEnabled()) return Response.json({ error: "uploads are off" }, { status: 404 });
  const { id } = await context.params;
  const owned = await ownedAdvert(id);
  if ("error" in owned) return Response.json({ error: owned.error }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { videoId?: string };
  if (!body.videoId) return Response.json({ error: "video" }, { status: 400 });
  const base = process.env.VIDEO_SERVICE_URL?.replace(/\/$/, "");
  const token = process.env.VIDEO_API_TOKEN;
  if (!base || !token) return Response.json({ error: "config" }, { status: 400 });
  const response = await fetch(`${base}/v1/videos/${body.videoId}`, { headers: { authorization: `Bearer ${token}` } });
  if (!response.ok) return Response.json({ error: "status" }, { status: 502 });
  const info = (await response.json()) as { status?: string; playbackUrl?: string; posterUrl?: string; durationSec?: number };
  await owned.prisma.video.updateMany({
    where: { advertId: id, remoteId: body.videoId },
    data: {
      status: info.status === "ready" ? "ready" : info.status === "failed" ? "failed" : "processing",
      playbackPath: info.playbackUrl || "",
      posterPath: info.posterUrl || "",
      durationSec: info.durationSec || 0,
    },
  });
  return Response.json({ ok: true, status: info.status || "processing" });
}
