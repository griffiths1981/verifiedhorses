import { loginAction } from "@/lib/actions/account";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 480 }}>
        <form className="auth-card stack" action={loginAction}>
          <h1>Sign in</h1>
          {query.error === "credentials" ? <p className="alert" role="alert">Those details do not match, or the account is closed.</p> : null}
          {query.error === "rate" ? <p className="alert" role="alert">Too many tries. Wait a few minutes.</p> : null}
          <input type="hidden" name="next" value={query.next || "/account"} />
          <label>Email<input name="email" type="email" autoComplete="username" required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
          <button className="gold" type="submit">Sign in</button>
          <p>New here? <a href="/register">Create an account</a></p>
          <p className="muted">Example accounts, if the demo data is loaded: buyer@verifiedhorses.example / Demo-buyer-1, and amelia@verifiedhorses.example / Demo-seller-1.</p>
        </form>
      </div>
    </section>
  );
}
