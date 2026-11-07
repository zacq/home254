import type { ReactNode } from "react";
import { ActionBar } from "@/components/ActionBar";
import { Analytics } from "@/components/Analytics";
import { CartProvider } from "@/components/CartProvider";
import { CompareBar } from "@/components/Compare";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { jsonLd } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const s = await getSettings();
  const ld = {
    "@context": "https://schema.org",
    "@type": "HomeGoodsStore",
    name: s.storeName,
    telephone: s.phoneTel,
    email: s.email,
    address: { "@type": "PostalAddress", streetAddress: s.showroomAddress, addressCountry: "KE" },
    openingHours: s.openingHours,
    priceRange: "KSh 12,000 – KSh 140,000",
  };
  return (
    <CartProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3">Skip to content</a>
      <Header storeName={s.storeName} phoneTel={s.phoneTel} phoneDisplay={s.phoneDisplay} announcement={s.announcement} />
      <main id="main" className="min-h-[60vh] pb-4">{children}</main>
      <Footer s={s} />
      <ActionBar whatsapp={s.whatsapp} phoneTel={s.phoneTel} />
      <CompareBar />
      <Analytics />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
    </CartProvider>
  );
}
