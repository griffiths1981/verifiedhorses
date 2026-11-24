# VerifiedHorses MVP report

24 November 2026. Private staging build. Nothing was bought, registered, or pointed at a live site.

## Done

- Accounts with email confirmation. Sellers and buyers. No SMS.
- Stripe Identity when test keys are set, and a clearly labelled demo check when they are not.
- Five-step sell flow: you, YouTube or Vimeo links, facts, papers, preview and fee. Each riding clip can have its own link. The player is a thumbnail until someone taps it.
- Video-first advert pages: clip checklist, key facts, dated documents, the “good to…” grid, a buy-safely panel, a report button, and a sticky message bar on mobile.
- Search with type, place and radius, budget, suits, and the other filters. Verified sellers and “has video” are on until you turn them off.
- County and type pages. They stay `noindex` on staging, and they stay `noindex` later until a page has at least three live adverts.
- Saved searches and email alerts, sent by the cron job, with an unsubscribe link.
- Email-style enquiries. The first buyer message hides phone numbers and email addresses. Deposit and off-site wording is flagged for the queue.
- Sold pages stay up.
- Admin queue on the site, and the bearer-token API in `AUTOMATION.md`, with an audit log.
- Admin-editable prices, seeded at £29, £39 PLUS, £19 youngstock, £45 horsebox and transport, and £59 a month trade.
- Stripe Checkout for those fees in test mode. Demo payment when there is no key. The site never holds a buyer’s money.
- A template description writer. No paid AI call.
- A services page with no affiliate links yet.
- Terms, privacy, cookies, welfare, safety and accessibility pages. The disclaimer is on the terms, the footer and every advert: VerifiedHorses is a listings platform only, is not a party to sales, gives no warranty on horses or sellers, and buyers should arrange their own vetting.
- Light cookie notice. No advertising scripts.
- Self-hosted Fraunces and Inter. UK English, GBP, dates as day/month/year.
- Example horses, clearly marked, so the staging site is not empty.
- `server.js` for Hostinger: listen immediately, 503 until ready, migrate, seed if empty, then Next. Preview basic auth. `noindex`.
- YouTube and Vimeo links, stored as a video id. Cards use the YouTube thumbnail and a play badge. A cron job flags clips that are private, missing, or cannot be embedded. `video-service/` remains in the repo and is off unless `VIDEO_UPLOADS_ENABLED=true`.
- Tests, a production build, and `npm audit` with no critical or high findings. Two moderate findings remain inside Vitest, which is not a production dependency. The video service audit is clean.

## Stubbed or left for later

- **Auctions.** A coming-soon page only. No bids.
- **Protected payment, escrow, and the badge.** Left out, as asked.
- **SMS verification.** Left out.
- **Phone calls and live chat.** Messages are threads plus email.
- **Price check.** The panel says there is not enough sold data until 10 similar sales exist. It does not invent a range.
- **Reviews and response-time scores.** Not shown.
- **Yard pages and dealer tools.** The trade price records a 30-day badge only.
- **PLUS social posting.** The seller gets a caption to copy. The site does not post it.
- **Loan and share, wanted adverts, boosts as a separate product.** Not built. PLUS is the seeded upgrade.
- **Affiliate links.** The services page links to public bodies and says there is no paid link yet.
- **Brevo, Stripe and the VPS.** The code is ready. The accounts and the server are not connected, because that needs Steve’s keys and a go-ahead to install on the VPS.
- **Legal review.** The pages are plain English for this staging site. They are not a solicitor’s draft, because that review is not happening.

## Environment variables

Listed in `.env.example` and the README. The ones that matter before a staging deploy are `BASE_URL`, `AUTH_SECRET`, `DATABASE_URL` (MySQL), `PREVIEW_BASIC_AUTH_USER`, `PREVIEW_BASIC_AUTH_PASSWORD`, `CRON_SECRET`, `ADMIN_API_TOKEN`, and `ADMIN_INITIAL_PASSWORD`. Leave `ALLOW_INDEXING` false. Leave Stripe and Brevo empty until the test accounts exist: the demo buttons and the email outbox cover them.

## Open questions

1. Legal name, and whether the footer should say sole trader or a company. VAT status is still for the accountant.
2. The domain, when you want one. `BASE_URL` is the only place the origin is set.
3. Final prices, and whether the first months should be free. The pricing page has a switch for that. The seeded numbers are placeholders.
4. Whether the trade fee should stay as a badge until yard pages exist.
5. Video is YouTube and Vimeo, so the VPS encoder is not needed. Leave `VIDEO_UPLOADS_ENABLED` false.
6. Stripe test keys, a Brevo key, and the from-address, when you want real email and real test payments.
7. The ICO fee, before any real personal data is collected. The privacy notice names the operator as “to be confirmed” until then.
8. Example data: set `SEED_DEMO=false` before any real seller uses the database, or use “Remove example data” in the admin queue.
