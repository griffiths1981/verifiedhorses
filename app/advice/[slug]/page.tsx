import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GUIDES } from "@/lib/guides";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = GUIDES.find((item) => item.slug === slug);
  return { title: guide?.title || "Advice", description: guide?.summary };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = GUIDES.find((item) => item.slug === slug);
  if (!guide) notFound();
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [{ "@type": "Question", name: guide.title, acceptedAnswer: { "@type": "Answer", text: guide.paragraphs[0] } }],
  };
  return (
    <article className="section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq).replace(/</g, "\\u003c") }} />
      <div className="wrap prose">
        <p><a href="/advice">Advice</a></p>
        <h1>{guide.title}</h1>
        {guide.paragraphs.map((paragraph) => <p key={paragraph.slice(0, 24)}>{paragraph}</p>)}
      </div>
    </article>
  );
}
