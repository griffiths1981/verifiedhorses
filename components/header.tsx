import { auth } from "@/lib/auth";

export async function Header() {
  const session = await auth();
  return (
    <header className="site-header">
      <div className="wrap header-row">
        <a className="wordmark" href="/">
          <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
            <path d="M7 15c0-6 4-11 9-11s9 5 9 11v4" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M7 15v4" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M12 22l3.2 3.2L22 17" fill="none" stroke="#C8922A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Verified<span>Horses</span>
        </a>
        <input id="nav-toggle" className="nav-toggle" type="checkbox" />
        <label className="nav-toggle-label" htmlFor="nav-toggle">Menu</label>
        <nav className="nav-links" aria-label="Main">
          <a href="/horses">Buy</a>
          <a href="/sell">Sell</a>
          <a href="/auctions">Auctions</a>
          <a href="/advice">Advice</a>
          {session?.user ? <a href="/account">Account</a> : <a href="/login">Sign in</a>}
        </nav>
        <a className="button gold" href="/sell">Sell a horse</a>
      </div>
    </header>
  );
}

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Mobile">
      <a href="/">Home</a>
      <a href="/horses">Search</a>
      <a href="/sell">Sell</a>
      <a href="/account/saved">Saved</a>
      <a href="/account">Account</a>
    </nav>
  );
}
