import { contactEmail } from "@/lib/config";

export const metadata = { title: "Accessibility" };

export default function AccessibilityPage() {
  return (
    <article className="section">
      <div className="wrap prose">
        <h1>Accessibility</h1>
        <p>We aim for WCAG 2.2 AA: text you can read, buttons you can reach, a keyboard path through the forms, and captions guidance for video. If something blocks you, email {contactEmail()} and say which page and what you were trying to do.</p>
        <p>Video on an advert does not autoplay with sound. Sellers are asked to tick which clips the video contains, which also helps if you cannot watch it.</p>
      </div>
    </article>
  );
}
