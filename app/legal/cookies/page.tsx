export const metadata = { title: "Cookies" };

export default function CookiesPage() {
  return (
    <article className="section">
      <div className="wrap prose">
        <h1>Cookies</h1>
        <p>The site uses one essential cookie so that a signed-in session stays signed in. It is set by the sign-in process and is not used for advertising.</p>
        <p>The short notice at the bottom of the page remembers that you have read it, using local storage on your device rather than a tracking cookie. We do not load analytics or advertising scripts.</p>
        <p>The private staging site may also ask for a username and password in the browser (HTTP basic authentication). That is a gate on the whole site, not a cookie.</p>
      </div>
    </article>
  );
}
