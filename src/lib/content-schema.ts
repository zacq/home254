import { LAUNDRY_FEATURES as FEATURES } from "@/lib/catalog";
import { slugify } from "@/lib/format";
import { FAQS, TECH_FEATURES } from "@/lib/tech";

export type Item = Record<string, string>;
export type Field = { key: string; label: string; type?: "text" | "textarea" | "image" | "select"; hint?: string; options?: string[] };
type BlockBase = { title: string; description: string; group: string; fields: Field[] };
type ObjectBlock = BlockBase & { kind: "object"; defaults: Item };
type ListBlock = BlockBase & { kind: "list"; itemLabel: string; defaults: Item[] };
export type Block = ObjectBlock | ListBlock;

const BODY_HINT = "Plain text. Start a line with ## for a heading or - for a bullet. Use **bold** and [link text](/page).";
const PAGE_FIELDS: Field[] = [
  { key: "title", label: "Page title" },
  { key: "intro", label: "Intro line", type: "textarea" },
  { key: "body", label: "Page text", type: "textarea", hint: BODY_HINT },
];

export const BLOCKS = {
  promoStrip: {
    kind: "list",
    group: "Site-wide",
    title: "Top promo strip",
    description: "Rotating messages above the header. Use the Rewards style for the loyalty banner with tier badges.",
    itemLabel: "Message",
    fields: [
      { key: "text", label: "Message" },
      { key: "href", label: "Link", hint: "e.g. /deals or /rewards" },
      { key: "kind", label: "Style", type: "select", options: ["deals", "rewards"] },
    ],
    defaults: [
      { text: "Unbeatable deals – up to 50% off selected appliances", href: "/deals", kind: "deals" },
      { text: "Best Price Promise: found it cheaper? We'll match it", href: "/best-price-promise", kind: "deals" },
      { text: "Nyumbani Rewards – join free, start earning today", href: "/rewards", kind: "rewards" },
    ],
  },
  branches: {
    kind: "list",
    group: "Site-wide",
    title: "Stores & branches",
    description: "Shown on the store locator page and in the footer.",
    itemLabel: "Branch",
    fields: [
      { key: "name", label: "Branch name" },
      { key: "address", label: "Address", type: "textarea" },
      { key: "hours", label: "Opening hours" },
      { key: "phone", label: "Phone" },
      { key: "mapQuery", label: "Google Maps search text" },
    ],
    defaults: [{ name: "Main showroom", address: "Showroom address to be confirmed, Nairobi", hours: "Mon–Sat 8:30am–6:00pm · Sun 11:00am–4:00pm", phone: "", mapQuery: "Nairobi, Kenya" }],
  },
  slides: {
    kind: "list",
    group: "Homepage",
    title: "Hero deal slider",
    description: "3–5 slides at the top of the homepage.",
    itemLabel: "Slide",
    fields: [
      { key: "eyebrow", label: "Small label above the heading" },
      { key: "heading", label: "Heading" },
      { key: "subheading", label: "Supporting text", type: "textarea" },
      { key: "ctaLabel", label: "Button text" },
      { key: "ctaHref", label: "Button link", hint: "e.g. /tvs or /deals" },
      { key: "image", label: "Background image", type: "image" },
    ],
    defaults: [
      { eyebrow: "Deals of the week", heading: "Unbeatable deals on TVs, fridges & more", subheading: "Priced at or below the market, with points on every purchase.", ctaLabel: "Shop deals", ctaHref: "/deals", image: "/images/hero.svg" },
      { eyebrow: "Nyumbani Rewards", heading: "Earn points on everything you buy", subheading: "Join free and get 200 welcome points. Use them at checkout on your next order.", ctaLabel: "Join free", ctaHref: "/rewards", image: "/images/hero.svg" },
      { eyebrow: "Best Price Promise", heading: "Found it cheaper? We'll match it.", subheading: "Same model, new and in stock at an authorised Kenyan retailer — we match the price.", ctaLabel: "How it works", ctaHref: "/best-price-promise", image: "/images/hero.svg" },
    ],
  },
  banners: {
    kind: "list",
    group: "Homepage",
    title: "Promo banners",
    description: "Optional promotions shown under the trust strip. Leave empty to show none.",
    itemLabel: "Banner",
    fields: [
      { key: "title", label: "Heading" },
      { key: "text", label: "Text", type: "textarea" },
      { key: "ctaLabel", label: "Button text" },
      { key: "ctaHref", label: "Button link" },
      { key: "image", label: "Image", type: "image" },
    ],
    defaults: [],
  },
  trust: {
    kind: "list",
    group: "Homepage",
    title: "Trust strip",
    description: "Short reassurance points under the hero.",
    itemLabel: "Point",
    fields: [
      { key: "icon", label: "Icon (one emoji)" },
      { key: "title", label: "Title" },
      { key: "text", label: "Detail" },
    ],
    defaults: [
      { icon: "🏷️", title: "Best Price Promise", text: "Found it cheaper? We match it" },
      { icon: "⭐", title: "Points on everything", text: "Up to 2% back with Rewards" },
      { icon: "🛡️", title: "Genuine warranty", text: "Register online with E-Warranty" },
      { icon: "💳", title: "Flexible payment", text: "M-Pesa, Pay on Delivery, instalments" },
    ],
  },
  homeBlocks: {
    kind: "object",
    group: "Homepage",
    title: "Quiz & showroom blocks",
    description: "The two call-outs lower on the homepage.",
    fields: [
      { key: "quizHeading", label: "Quiz heading" },
      { key: "quizText", label: "Quiz text" },
      { key: "showroomHeading", label: "Showroom heading" },
      { key: "showroomText", label: "Showroom text", type: "textarea" },
      { key: "showroomImage", label: "Showroom image", type: "image" },
    ],
    defaults: {
      quizHeading: "Which washing machine is right for me?",
      quizText: "Answer five quick questions and get 1–3 recommendations in under a minute.",
      showroomHeading: "See it before you pay",
      showroomText: "Visit a store to see TVs, fridges, cookers and washers running. We'll explain the options and confirm it fits your space.",
      showroomImage: "/images/showroom.svg",
    },
  },
  productInfo: {
    kind: "object",
    group: "Shop pages",
    title: "Product page notes",
    description: "Text shared by every product page. Category intros are edited under Categories.",
    fields: [
      { key: "priceNote", label: "Note beside the stock badge" },
      { key: "inTheBox", label: "What's in the box", type: "textarea" },
      { key: "installNeeds", label: "Washer installation needs", type: "textarea", hint: "One requirement per line. Shown on washing machines and dryers." },
    ],
    defaults: {
      priceNote: "",
      inTheBox: "The appliance, user manual and warranty card. Accessories vary by model; see the specification.",
      installNeeds: "Water inlet tap (¾ inch) within 1.5m\nFloor drain or standpipe\n13A earthed socket",
    },
  },
  rewardsPage: {
    kind: "object",
    group: "Rewards & trust",
    title: "Rewards hub",
    description: "Earn rates, tier thresholds and bonus values come from Admin → Rewards. This is the surrounding text.",
    fields: [
      { key: "intro", label: "Intro", type: "textarea" },
      { key: "terms", label: "Rewards terms", type: "textarea", hint: BODY_HINT },
    ],
    defaults: {
      intro: "Earn points on every product you buy, climb the tiers for bigger rewards, and use your points as money off your next order.",
      terms: `## Rewards terms
- Points are earned on product value only, not on delivery or installation fees.
- Points are pending until your order is delivered, then become available.
- 1 point = KSh 1 off at checkout. You need at least 200 points to redeem, and points can pay for up to 10% of an order's product value.
- Points expire 12 months after your last purchase.
- Tiers are based on what you spent in the last 12 months. A big purchase can move you up straight away; tiers are only lowered at the annual review.
- Points on cancelled or refunded orders are reversed. Points have no cash value and cannot be transferred.
- One account per phone number. We may change these terms with notice on this page.`,
    },
  },
  rewardsFaqs: {
    kind: "list",
    group: "Rewards & trust",
    title: "Rewards FAQs",
    description: "Questions on the Rewards hub.",
    itemLabel: "Question",
    fields: [
      { key: "q", label: "Question" },
      { key: "a", label: "Answer", type: "textarea" },
    ],
    defaults: [
      { q: "How do I join?", a: "Tap Sign in, enter your phone number and the one-time code we send you. Joining is free and you get welcome points straight away." },
      { q: "I ordered as a guest. Can I still get the points?", a: "Yes. Join with the same phone number you used at checkout and the points from that order appear in your account." },
      { q: "When can I use my points?", a: "Once your order is delivered the points become available. Use them at checkout by ticking 'Use points'." },
      { q: "Do points expire?", a: "Points expire 12 months after your last purchase, so any purchase keeps them alive." },
    ],
  },
  bestPrice: {
    kind: "object",
    group: "Rewards & trust",
    title: "Best Price Promise",
    description: "Rules and terms shown above the price-match form.",
    fields: PAGE_FIELDS,
    defaults: {
      title: "Best Price Promise",
      intro: "Found a lower advertised price for the same model? Tell us and we'll match it — and you still earn points.",
      body: `## How it works
- Find a lower advertised price for the **same model**, **new and in stock**, from an **authorised Kenyan retailer**.
- Send us the details with the form below or on WhatsApp, with a link or photo of the advertised price.
- We check it within **24 hours** and send you a one-time price code for checkout.

## Exclusions
- Clearance, ex-display or refurbished items.
- Marketplace and third-party sellers.
- Bundle-only prices, prices that need a voucher, and members-only prices elsewhere.
- One claim per product per customer.`,
    },
  },
  warranty: {
    kind: "object",
    group: "Rewards & trust",
    title: "E-Warranty & after sales",
    description: "Text on the E-Warranty page. The bonus points value comes from Admin → Rewards.",
    fields: PAGE_FIELDS,
    defaults: {
      title: "E-Warranty & after sales",
      intro: "Register your warranty online, earn bonus points, and request a technician when you need one.",
      body: `## Why register?
- We hold your proof of purchase, so warranty claims are quick.
- Rewards members get bonus points once the registration is checked.

## What the warranty covers
Manufacturing defects for the period stated on the product page. It does not cover misuse, power-surge damage without a guard, or repairs by unauthorised technicians.`,
    },
  },
  warrantyFaqs: {
    kind: "list",
    group: "Rewards & trust",
    title: "E-Warranty FAQs",
    description: "Questions on the E-Warranty page.",
    itemLabel: "Question",
    fields: [
      { key: "q", label: "Question" },
      { key: "a", label: "Answer", type: "textarea" },
    ],
    defaults: [
      { q: "Where do I find the serial number?", a: "On the rating sticker, usually at the back or inside the door. It is also on the box." },
      { q: "I bought in store. Can I still register?", a: "Yes. Use the serial number and send a photo of your receipt on WhatsApp." },
      { q: "How fast does a technician come?", a: "We call you within one working day to book a visit. Nairobi visits are usually within 2–3 days." },
    ],
  },
  tech: {
    kind: "list",
    group: "Education",
    title: "Technology Explained",
    description: "One section per feature. Product pages link to these sections.",
    itemLabel: "Feature",
    fields: [
      { key: "name", label: "Feature name" },
      { key: "id", label: "Page anchor", hint: "Leave blank to fill automatically. Do not change existing ones: product pages link to them." },
      { key: "icon", label: "Icon (one emoji, used when there is no image)" },
      { key: "image", label: "Visual", type: "image" },
      { key: "tag", label: "Links to machines with", type: "select", options: ["", ...FEATURES, "Inverter motor"] },
      { key: "what", label: "What it does", type: "textarea" },
      { key: "benefit", label: "The benefit", type: "textarea" },
      { key: "benefitLabel", label: "Benefit badge" },
    ],
    defaults: TECH_FEATURES.map((t) => ({ id: t.id, name: t.name, icon: t.icon, image: "", tag: t.tag ?? "", what: t.what, benefit: t.benefit, benefitLabel: t.benefitLabel })),
  },
  guide: {
    kind: "object",
    group: "Education",
    title: "Buying guide",
    description: "The written guide on the Which Machine page.",
    fields: PAGE_FIELDS,
    defaults: {
      title: "Which machine is right for me?",
      intro: "Take the 60-second quiz, or read the guide below.",
      body: `## Written guide by household and space
- **1–2 people, small apartment:** an 8/5kg or 9/6kg washer-dryer combo. One machine, no line-drying.
- **3–4 people:** a 9–10kg front-load washer; add a heat-pump dryer if you can't dry outside.
- **5 or more people:** 10–12kg front-load (A+++ for low running cost), or a 12/8kg combo if space is tight.
- **Baby clothes or allergies:** pick SpaCare steam wash with a baby-care cycle.
- **Upgrading from a twin-tub:** an automatic front-load washes, rinses and spins by itself — you just load, press start and walk away. It needs a water inlet, a drain and a socket.
- **Budget near KSh 30–40K:** see our entry-level top-load and twin-tub range, with Pay on Delivery.`,
    },
  },
  faqs: {
    kind: "list",
    group: "Education",
    title: "FAQs",
    description: "Common questions on the Which Machine page.",
    itemLabel: "Question",
    fields: [
      { key: "q", label: "Question" },
      { key: "a", label: "Answer", type: "textarea" },
    ],
    defaults: FAQS.map((f) => ({ q: f.q, a: f.a })),
  },
  about: {
    kind: "object",
    group: "Pages & policies",
    title: "About us",
    description: "The dealer status statement comes from Settings.",
    fields: PAGE_FIELDS,
    defaults: {
      title: "About us",
      intro: "",
      body: `## Our story
NyumbaniAppliances helps Kenyan households furnish their homes with TVs, fridges, cookers, washers and everyday appliances — at or below the market price, with points on every purchase.

## How we sell
- We check our prices against the market every week and keep a Best Price Promise.
- Real stock counts, real offer end dates and genuine was-prices — no fake countdowns.
- Reviews come only from customers whose order was delivered.
- Talk to a person on WhatsApp, phone or in store before you pay.
- Delivery and installation by our own team in listed zones.`,
    },
  },
  payment: {
    kind: "object",
    group: "Pages & policies",
    title: "Payment options",
    description: "Till number, deposit and Pay on Delivery values come from Settings and Delivery zones.",
    fields: [
      { key: "title", label: "Page title" },
      { key: "intro", label: "Intro line", type: "textarea" },
      { key: "instalments", label: "Instalments text", type: "textarea" },
    ],
    defaults: {
      title: "Payment options",
      intro: "Pay the way you trust. Every order is confirmed by a real person before delivery.",
      instalments: "Plans available — ask us. We refer you to our financing partner, who decides approval and terms. We only show monthly amounts once the partner has confirmed approved rates.",
    },
  },
  delivery: {
    kind: "object",
    group: "Pages & policies",
    title: "Delivery, installation & warranty",
    description: "The zones table is filled from Delivery zones. This text appears under it.",
    fields: PAGE_FIELDS,
    defaults: {
      title: "Delivery, installation & warranty",
      intro: "",
      body: `## Delivery slots
Choose a preferred date and time at checkout. When your order is dispatched we send you the driver's name and phone number.

## Installation services
Choose installation at checkout: washer and dryer installation, TV wall mounting, cooker gas connection and more. Prices are shown on each product page and at checkout.

## Washer and dryer site requirements
- Water inlet tap (¾ inch) within about 1.5m
- Floor drain or standpipe
- 13A earthed socket
- A clear path and a level floor

## Warranty
Warranty terms are stated on each product page. [Register your warranty online](/e-warranty) to make claims faster and earn bonus points.
- General warranty: covers manufacturing defects (period stated per model).
- Not covered: damage from misuse, power surges without protection, or unauthorised repairs.

## Returns
See our [returns & refunds policy](/returns).

## After-sales
Use the [service request form](/e-warranty#service), or call or WhatsApp us with your order number.`,
    },
  },
  terms: {
    kind: "object",
    group: "Pages & policies",
    title: "Terms of sale",
    description: "",
    fields: PAGE_FIELDS,
    defaults: {
      title: "Terms of sale",
      intro: "",
      body: `## 1. Orders & prices
All prices are in Kenya Shillings (KSh). Prices and availability are confirmed by our sales team when your order is confirmed. If a price changes or an item is out of stock before confirmation, we will contact you and you may cancel at no cost.

## 2. Payment
We accept M-Pesa (Till) and Pay on Delivery in eligible zones and up to the stated order value. Orders above the deposit threshold may require a deposit. An M-Pesa order is confirmed once payment is verified by our team.

## 3. Delivery & installation
Delivery fees and lead times depend on your zone and are shown at checkout. You or a representative must be available to receive and inspect the goods. Installation requires a suitable water inlet, drain and socket.

## 4. Warranty
Each product page states its warranty. Warranty covers manufacturing defects and does not cover misuse, unsuitable installation or unauthorised repairs.

## 5. Returns
See our [returns & refunds policy](/returns).

## 6. Rewards, promo codes and price matching
Points are earned and redeemed under the [Rewards terms](/rewards#terms). One promo code can be used per order. Price-match codes issued under our [Best Price Promise](/best-price-promise) are for one unit of the named product, for the named phone number, and expire on the date given.

## 7. Contact
Questions about these terms? Contact us by WhatsApp, phone or email shown in the footer.`,
    },
  },
  privacy: {
    kind: "object",
    group: "Pages & policies",
    title: "Privacy policy",
    description: "",
    fields: PAGE_FIELDS,
    defaults: {
      title: "Privacy policy",
      intro: "Aligned with the Kenya Data Protection Act, 2019.",
      body: `## What we collect
When you place an order, join Rewards, book a visit, ask about instalments or send an enquiry, we collect your name, phone number, delivery address and, optionally, email. For Rewards members we keep a record of points earned and used, your tier and your wishlist. We record M-Pesa transaction codes only to match payments to orders. We never store card data.

## Why we collect it
- To process, deliver and install your order, and provide warranty support.
- To run your Rewards account: points, tiers and one-time sign-in codes.
- To send deals and points updates, only if you opt in. Every message lets you opt out.
- To respond to enquiries, bookings, price-match and instalment requests (with your consent).
- To refer instalment enquiries to our financing partner, only with your consent.
- To measure site performance using analytics (Google Analytics, Meta Pixel) where enabled.

## Your rights
You may access, correct or delete your personal data at any time. Signed-in members can download their data from the account page; for corrections or deletion, contact us. We retain order records only as long as needed for warranty and legal obligations.

## Security
Our site uses HTTPS, one-time codes for member sign-in, role-restricted admin access with two-factor sign-in, and spam protection on forms.

## Contact
For data requests, contact us via the email or phone in the footer.`,
    },
  },
  returns: {
    kind: "object",
    group: "Pages & policies",
    title: "Returns & refunds",
    description: "",
    fields: PAGE_FIELDS,
    defaults: {
      title: "Returns & refunds",
      intro: "",
      body: `## Damaged or faulty on arrival
Inspect your appliance on delivery. If it is damaged or not working, tell the driver and contact us within 48 hours. We will repair, replace or refund.

## Change of mind
Unused, uninstalled appliances in original packaging may be returned within 7 days of delivery. Delivery fees are non-refundable and a handling fee may apply.

## Not eligible
- Appliances already installed and used (covered by warranty instead).
- Damage caused by misuse or unsuitable installation.

## Refunds
Approved refunds are paid by M-Pesa within 7 working days. Points earned on a refunded order are removed, and points you used on it are returned to your account.`,
    },
  },
} satisfies Record<string, Block>;

export type BlockKey = keyof typeof BLOCKS;
export type ContentValue<K extends BlockKey> = (typeof BLOCKS)[K] extends ListBlock ? Item[] : Item;

export const isBlockKey = (k: string): k is BlockKey => Object.prototype.hasOwnProperty.call(BLOCKS, k);

function cleanItem(fields: Field[], raw: unknown): Item {
  const src = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: Item = {};
  for (const f of fields) {
    const v = src[f.key];
    out[f.key] = typeof v === "string" ? v.trim().slice(0, 30_000) : "";
  }
  return out;
}

export function sanitizeBlock(key: BlockKey, raw: unknown): Item | Item[] {
  const b: Block = BLOCKS[key];
  if (b.kind === "object") return cleanItem(b.fields, raw);
  const items = (Array.isArray(raw) ? raw : []).map((r) => cleanItem(b.fields, r)).filter((i) => Object.values(i).some(Boolean));
  if (key === "tech") for (const i of items) i.id ||= slugify(i.name);
  return items;
}
