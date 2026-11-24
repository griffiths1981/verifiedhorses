import { GUIDES } from "@/lib/guides";

export const metadata = { title: "Advice" };

export default function AdvicePage() {
  return (
    <section className="section">
      <div className="wrap prose">
        <h1>Advice</h1>
        <p>Short guides for buyers. They are general information, not veterinary or legal advice.</p>
        <ul className="plain-list">
          {GUIDES.map((guide) => (
            <li key={guide.slug}><a href={`/advice/${guide.slug}`}><strong>{guide.title}</strong></a><br />{guide.summary}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
