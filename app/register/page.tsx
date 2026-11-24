import { registerAction } from "@/lib/actions/account";

export const metadata = { title: "Create an account" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const errors: Record<string, string> = {
    fields: "Check your name, email, a password of at least 10 characters, and the terms box.",
    exists: "That email already has an account. Sign in instead.",
    rate: "Too many new accounts from here. Try again later.",
  };
  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 520 }}>
        <form className="auth-card stack" action={registerAction}>
          <h1>Create an account</h1>
          {query.error ? <p className="alert" role="alert">{errors[query.error] || "Try again."}</p> : null}
          <input type="hidden" name="ref" value={query.ref || ""} />
          <label>Name<input name="name" required /></label>
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" autoComplete="new-password" minLength={10} required /></label>
          <label>I am a
            <select name="role" defaultValue="buyer">
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
            </select>
          </label>
          <label className="row"><input type="checkbox" name="agree" required /> I agree to the <a href="/legal/terms">terms</a> and <a href="/legal/privacy">privacy notice</a></label>
          <button className="gold" type="submit">Create account</button>
        </form>
      </div>
    </section>
  );
}
