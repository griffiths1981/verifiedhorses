import { contactEmail } from "@/lib/config";
import { enqueueEmail } from "@/lib/mail";
import { redirect } from "next/navigation";
import { rateLimit } from "@/lib/rate-limit";

export const metadata = { title: "Contact" };

async function sendContact(formData: FormData) {
  "use server";
  const name = String(formData.get("name") || "").slice(0, 80);
  const email = String(formData.get("email") || "").slice(0, 120);
  const message = String(formData.get("message") || "").slice(0, 4000);
  if (!name || !email || message.length < 10) redirect("/contact?error=1");
  if (!rateLimit(`contact:${email}`, 5, 60 * 60 * 1000)) redirect("/contact?error=rate");
  await enqueueEmail({
    to: contactEmail(),
    kind: "contact",
    subject: `Contact from ${name}`,
    body: `${name} <${email}>\n\n${message}`,
  });
  redirect("/contact?sent=1");
}

export default async function ContactPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  return (
    <section className="section">
      <div className="wrap prose">
        <h1>Contact</h1>
        <p>Email {contactEmail()}, or use the form. On this staging site the message is stored in the email outbox unless a mail provider is configured.</p>
        {query.sent ? <p className="ok" role="status">Message received.</p> : null}
        {query.error ? <p className="alert" role="alert">Add your name, email and a short message.</p> : null}
        <form className="stack" action={sendContact}>
          <label>Name<input name="name" required /></label>
          <label>Email<input name="email" type="email" required /></label>
          <label>Message<textarea name="message" required /></label>
          <button className="gold" type="submit">Send</button>
        </form>
      </div>
    </section>
  );
}
