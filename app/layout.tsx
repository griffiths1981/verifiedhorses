import type { Metadata } from "next";
import "./globals.css";
import { Header, BottomNav } from "@/components/header";
import { Footer } from "@/components/footer";
import { CookieBanner } from "@/components/cookie-banner";
import { baseUrl, indexingAllowed } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const index = indexingAllowed();
  return {
    metadataBase: new URL(baseUrl()),
    title: { default: "VerifiedHorses", template: "%s | VerifiedHorses" },
    description: "Buy a horse you can trust. ID-checked sellers, a video on every advert, and dated vetting documents. Proudly northern.",
    robots: index ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        <a className="skip" href="#content">Skip to content</a>
        <Header />
        <main id="content">{children}</main>
        <Footer />
        <BottomNav />
        <CookieBanner />
      </body>
    </html>
  );
}
