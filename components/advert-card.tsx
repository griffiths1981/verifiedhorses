import { formatAge, formatDuration, formatHeight, formatPrice } from "@/lib/format";
import { typeLabel } from "@/lib/constants";

type CardAdvert = {
  slug: string;
  horseName: string;
  type: string;
  breed: string;
  ageYears: number;
  ageMonths: number;
  heightInches: number;
  colour: string;
  sex: string;
  pricePence: number;
  town: string;
  status: string;
  featured: boolean;
  seller: { idStatus: string };
  videos: { durationSec: number; status: string }[];
  documents: { kind: string; issuedOn: Date | null }[];
};

export function AdvertCard({ advert, miles }: { advert: CardAdvert; miles: number | null }) {
  const video = advert.videos.find((item) => item.status === "ready" || item.status === "example");
  const vetted = advert.documents.find((item) => item.kind === "vetting" && item.issuedOn);
  const xray = advert.documents.some((item) => item.kind === "xrays");
  const hue = advert.slug.length % 3;
  const facts = [
    advert.ageYears || advert.ageMonths ? formatAge(advert.ageYears, advert.ageMonths) : "",
    formatHeight(advert.heightInches),
    advert.colour,
    advert.sex || typeLabel(advert.type),
  ].filter(Boolean);
  return (
    <a className="card" href={`/horses/${advert.slug}`}>
      <div className={`poster ${hue === 1 ? "b" : hue === 2 ? "c" : ""}`}>
        <span className="badge">{advert.status === "sold" ? "Sold" : video ? `${formatDuration(video.durationSec)} video` : "Video"}</span>
      </div>
      <div className="card-body">
        <p className="price">{formatPrice(advert.pricePence)}{advert.status === "sold" ? " · sold" : ""}</p>
        <p style={{ margin: "4px 0" }}>
          {advert.seller.idStatus === "verified" ? <span className="verified">ID verified</span> : <span className="muted">Seller not ID-checked</span>}
          {advert.featured ? " · PLUS" : ""}
        </p>
        <p style={{ margin: "4px 0" }}>
          <strong>{advert.horseName || typeLabel(advert.type)}</strong>
          {facts.length ? ` · ${facts.join(" · ")}` : ""}
          {advert.breed ? ` · ${advert.breed}` : ""}
        </p>
        <p className="muted" style={{ margin: "4px 0 8px" }}>
          {advert.town}
          {miles !== null ? ` · ${Math.round(miles)} miles` : ""}
        </p>
        <div className="row">
          {vetted?.issuedOn ? <span className="tag">Vetted {vetted.issuedOn.getUTCFullYear()}</span> : null}
          {xray ? <span className="tag">X-rays</span> : null}
        </div>
      </div>
    </a>
  );
}
