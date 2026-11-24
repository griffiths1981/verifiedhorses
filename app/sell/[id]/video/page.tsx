import { notFound } from "next/navigation";
import { requireUser } from "@/lib/current-user";
import { db } from "@/lib/prisma";
import { CLIPS } from "@/lib/constants";
import { saveClips } from "@/lib/actions/sell";
import { SellProgress } from "@/components/sell-progress";

export const metadata = { title: "Add a video" };

const CLIP_ERRORS: Record<string, string> = Object.fromEntries(CLIPS);

export default async function VideoStep({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const prisma = await db();
  const advert = await prisma.advert.findUnique({ where: { id }, include: { videos: true, photos: true } });
  if (!advert || (advert.sellerId !== user.id && user.role !== "admin")) notFound();
  const byClip = new Map(advert.videos.map((video) => [video.clipKey, video.sourceUrl || video.playbackPath]));
  return (
    <section className="section">
      <div className="wrap prose">
        <SellProgress id={id} step={1} />
        <h1>Video first</h1>
        <p>Upload your video to YouTube (Unlisted is fine) and paste the link. Vimeo links work too. Each riding clip can have its own link. We store the video id, not the file.</p>
        {query.error === "link" ? <p className="alert" role="alert">That link for {CLIP_ERRORS[query.clip || ""] || "a clip"} is not a YouTube or Vimeo address we can use. Use a watch, youtu.be, Shorts or vimeo.com link.</p> : null}
        {query.error === "missing" ? <p className="alert" role="alert">Paste at least one video link.</p> : null}
        {query.saved ? <p className="ok" role="status">Links saved.</p> : null}
        <form className="stack" action={saveClips}>
          <input type="hidden" name="id" value={id} />
          <fieldset className="stack">
            <legend>Riding clips</legend>
            {CLIPS.map(([key, label]) => (
              <label key={key}>{label}
                <input name={`link_${key}`} type="url" inputMode="url" placeholder="https://youtu.be/…" defaultValue={byClip.get(key) || ""} />
              </label>
            ))}
          </fieldset>
          <label>A short note for people who cannot watch it<textarea name="videoNote" defaultValue={advert.videoNote} /></label>
          <button className="gold" type="submit">Save the videos</button>
        </form>
        <form className="stack" action={`/api/sell/${id}/photo`} method="post" encType="multipart/form-data">
          <label>Photo, optional<input type="file" name="file" accept="image/jpeg,image/png,image/webp" /></label>
          <label>Alt text<input name="alt" placeholder="Bay mare walking in a school" /></label>
          <button className="ghost" type="submit">Add photo</button>
        </form>
        <p>{advert.videos.length} video link{advert.videos.length === 1 ? "" : "s"}, {advert.photos.length} photo{advert.photos.length === 1 ? "" : "s"}.</p>
      </div>
    </section>
  );
}