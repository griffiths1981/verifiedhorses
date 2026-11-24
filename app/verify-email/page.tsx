import { db } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import { resendVerification } from "@/lib/actions/account";

export const metadata = { title: "Confirm your email" };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  let confirmed = false;
  if (query.token && query.pending !== "1") {
    const prisma = await db();
    const row = await prisma.emailToken.findUnique({ where: { tokenHash: hashToken(query.token) } });
    if (row && !row.usedAt && row.expiresAt > new Date()) {
      await prisma.user.update({ where: { id: row.userId }, data: { emailVerifiedAt: new Date() } });
      await prisma.emailToken.update({ where: { id: row.id }, data: { usedAt: new Date() } });
      confirmed = true;
    }
  }
  return (
    <section className="section">
      <div className="wrap prose">
        <h1>Email confirmation</h1>
        {confirmed ? <p className="ok" role="status">Email confirmed. You can sign in.</p> : null}
        {query.pending ? <p>We have a confirmation link for {query.email || "you"}. Open it within 48 hours.</p> : null}
        {query.pending && query.token ? (
          <p className="example">Staging, with no email provider set: <a href={`/verify-email?token=${encodeURIComponent(query.token)}`}>confirm this address now</a>.</p>
        ) : null}
        <form action={resendVerification} className="stack">
          <label>Email<input name="email" type="email" defaultValue={query.email || ""} required /></label>
          <button type="submit">Send the link again</button>
        </form>
      </div>
    </section>
  );
}
