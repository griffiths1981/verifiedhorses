import { notFound } from "next/navigation";
import { requireUser } from "@/lib/current-user";
import { db } from "@/lib/prisma";
import { DOC_KINDS, docLabel } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { SellProgress } from "@/components/sell-progress";

export const metadata = { title: "Documents" };

export default async function DocumentsStep({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const prisma = await db();
  const advert = await prisma.advert.findUnique({ where: { id }, include: { documents: true } });
  if (!advert || (advert.sellerId !== user.id && user.role !== "admin")) notFound();
  return (
    <section className="section">
      <div className="wrap prose">
        <SellProgress id={id} step={3} />
        <h1>Papers</h1>
        <p>Optional, and worth doing. A date is enough for the badge. The file stays private to signed-in buyers, or only to people you have a message thread with.</p>
        {query.saved ? <p className="ok" role="status">Document saved.</p> : null}
        {query.error ? <p className="alert" role="alert">Check the type, the date, and that the file is a PDF or a photo under 10 MB.</p> : null}
        <ul>
          {advert.documents.map((document) => (
            <li key={document.id}>{docLabel(document.kind)} · {formatDate(document.issuedOn)} · {document.visibility === "on_request" ? "on request" : "signed-in buyers"}</li>
          ))}
        </ul>
        <form className="stack" action={`/api/sell/${id}/document`} method="post" encType="multipart/form-data">
          <label>Type<select name="kind">{DOC_KINDS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Date of the document<input name="issued" type="date" required /></label>
          <label>File, optional<input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" /></label>
          <label>Microchip number, if this is the microchip<input name="microchip" inputMode="numeric" /></label>
          <label className="row"><input type="checkbox" name="visibility" value="on_request" /> Only share the file after someone messages you</label>
          <button type="submit">Add document</button>
        </form>
        <p><a className="button gold" href={`/sell/${id}/preview`}>Continue to preview</a></p>
      </div>
    </section>
  );
}
