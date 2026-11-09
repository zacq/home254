import type { ReactNode } from "react";
import { ActionBar } from "@/components/ActionBar";
import { Analytics } from "@/components/Analytics";
import { CartProvider } from "@/components/CartProvider";
import { CompareBar } from "@/components/Compare";
import { ReviewPopup, SideBars } from "@/components/Floating";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { WishlistSync } from "@/components/Wishlist";
import { getContent } from "@/lib/content";
import { getCustomer } from "@/lib/customer-auth";
import { jsonLd } from "@/lib/format";
import { allProducts, getCategoryTree, verifiedReviews } from "@/lib/queries";
import { balances } from "@/lib/rewards";
import { getSettings, waLink } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [s, tree, promos, branches, member, reviews, all] = await Promise.all([
    getSettings(),
    getCategoryTree(),
    getContent("promoStrip"),
    getContent("branches"),
    getCustomer(),
    verifiedReviews(10),
    allProducts(),
  ]);
  const points = member ? (await balances(member.id)).available : 0;
  const memberInfo = member ? { name: member.name?.split(" ")[0] ?? "", points } : null;
  const menu = tree.map((c) => ({
    slug: c.slug,
    name: c.name,
    path: c.path,
    image: c.image,
    isCore: c.isCore,
    subs: c.subs.filter((x) => x.visible).map((x) => ({ name: x.name, path: x.path, image: x.image })),
  }));
  const names = new Map(all.map((p) => [p.id, p.name]));
  const popReviews = reviews.map((r) => ({ id: r.id, name: r.name, location: r.location, rating: r.rating, body: r.body, product: r.productId ? (names.get(r.productId) ?? null) : null }));
  const socials = [
    { label: "Instagram", href: s.instagram, icon: "IG" },
    { label: "Facebook", href: s.facebook, icon: "f" },
    { label: "YouTube", href: s.youtube, icon: "▶" },
  ];
  const ld = {
    "@context": "https://schema.org",
    "@type": "HomeGoodsStore",
    name: s.storeName,
    telephone: s.phoneTel,
    email: s.email,
    address: { "@type": "PostalAddress", streetAddress: s.showroomAddress, addressCountry: "KE" },
    openingHours: s.openingHours,
    department: branches.map((b) => ({ "@type": "HomeGoodsStore", name: `${s.storeName} ${b.name}`, address: { "@type": "PostalAddress", streetAddress: b.address, addressCountry: "KE" } })),
  };
  return (
    <CartProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3">Skip to content</a>
      <Header
        storeName={s.storeName}
        tagline={s.tagline}
        phoneTel={s.phoneTel}
        phoneDisplay={s.phoneDisplay}
        menu={menu}
        promos={promos.map((p) => ({ text: p.text, href: p.href, kind: p.kind || "deals" }))}
        member={memberInfo}
      />
      <main id="main" className="min-h-[60vh] pb-4">{children}</main>
      <Footer s={s} branches={branches} menu={menu} />
      <ActionBar whatsapp={s.whatsapp} phoneTel={s.phoneTel} />
      <SideBars member={memberInfo} socials={socials} whatsappHref={waLink(s.whatsapp, "Hi, I have a question.")} />
      <CompareBar />
      <ReviewPopup reviews={popReviews} />
      <WishlistSync signedIn={!!member} />
      <Analytics />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
    </CartProvider>
  );
}
