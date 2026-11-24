import { PLATFORM_DISCLAIMER } from "@/lib/constants";
import { NORTHERN_COUNTIES, slugifyCounty } from "@/lib/places";
import { contactEmail, legalEntity } from "@/lib/config";

export function Footer() {
  return (
    <footer className="section" style={{ background: "#17382b", color: "white" }}>
      <div className="wrap">
        <p style={{ maxWidth: "70ch" }}>{PLATFORM_DISCLAIMER}</p>
        <div className="grid-3">
          <div>
            <h2>Looking</h2>
            <p><a href="/horses">Horses for sale</a></p>
            <p><a href="/horses?type=pony">Ponies</a></p>
            <p><a href="/horses?type=cob">Cobs</a></p>
            <p><a href="/auctions">Auctions, coming soon</a></p>
          </div>
          <div>
            <h2>The North</h2>
            {NORTHERN_COUNTIES.slice(0, 6).map((county) => (
              <p key={county}><a href={`/horses-for-sale/${slugifyCounty(county)}`}>{county}</a></p>
            ))}
          </div>
          <div>
            <h2>The small print</h2>
            <p><a href="/legal/terms">Terms</a></p>
            <p><a href="/legal/privacy">Privacy</a></p>
            <p><a href="/legal/cookies">Cookies</a></p>
            <p><a href="/welfare">Welfare</a></p>
            <p><a href="/accessibility">Accessibility</a></p>
            <p><a href={`mailto:${contactEmail()}`}>{contactEmail()}</a></p>
          </div>
        </div>
        <p className="muted">Staging site. Not open to the public. {legalEntity()}.</p>
      </div>
    </footer>
  );
}
