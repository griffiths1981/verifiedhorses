import { notFound } from "next/navigation";
import { requireUser } from "@/lib/current-user";
import { db } from "@/lib/prisma";
import { CLIPS } from "@/lib/constants";
import { saveClips } from "@/lib/actions/sell";
import { SellProgress } from "@/components/sell-progress";
import { videoServiceConfigured } from "@/lib/config";
import { VideoUpload } from "@/components/video-upload";

export const metadata = { title: "Add a video" };

export default async function VideoStep({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const prisma = await db();
  const advert = await prisma.advert.findUnique({ where: { id }, include: { videos: true, photos: true } });
  if (!advert || (advert.sellerId !== user.id && user.role !== "admin")) notFound();
  const selected = new Set(advert.clips.split(",").filter(Boolean));
  return (
    <section className="section">
      <div className="wrap prose">
        <SellProgress id={id} step={1} />
        <h1>Video first</h1>
        {query.uploaded ? <p className="ok" role="status">Video saved on this server. It has not been re-encoded. Use the video service in production.</p> : null}
        {query.error ? <p className="alert" role="alert">Use an MP4 or WebM under 80 MB, or a JPEG, PNG or WebP photo under 8 MB.</p> : null}
        <form className="stack" action={saveClips}>
          <input type="hidden" name="id" value={id} />
          <fieldset>
            <legend>Which clips are in the video?</legend>
            {CLIPS.map(([key, label]) => (
              <label key={key} className="row"><input type="checkbox" name={`clip_${key}`} defaultChecked={selected.has(key)} /> {label}</label>
            ))}
          </fieldset>
          <label>A short note for people who cannot watch it<textarea name="videoNote" defaultValue={advert.videoNote} /></label>
          <button type="submit">Save the checklist</button>
        </form>
        {videoServiceConfigured() ? <VideoUpload advertId={id} /> : (
          <form className="stack" action={`/api/sell/${id}/video`} method="post" encType="multipart/form-data">
            <label>Video file<input type="file" name="file" accept="video/mp4,video/webm,video/quicktime" required /></label>
            <button className="gold" type="submit">Upload video</button>
          </form>
        )}
        <form className="stack" action={`/api/sell/${id}/photo`} method="post" encType="multipart/form-data">
          <label>Photo, optional<input type="file" name="file" accept="image/jpeg,image/png,image/webp" /></label>
          <label>Alt text<input name="alt" placeholder="Bay mare walking in a school" /></label>
          <button className="ghost" type="submit">Add photo</button>
        </form>
        <p>{advert.videos.length} video file{advert.videos.length === 1 ? "" : "s"}, {advert.photos.length} photo{advert.photos.length === 1 ? "" : "s"}.</p>
      </div>
    </section>
  );
}
