import { FEATURES, slugify } from "@/lib/format";
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
  hero: {
    kind: "object",
    group: "Homepage",
    title: "Hero banner",
    description: "The first thing buyers see on the homepage.",
    fields: [
      { key: "eyebrow", label: "Small label above the heading" },
      { key: "heading", label: "Heading" },
      { key: "subheading", label: "Supporting text", type: "textarea" },
      { key: "primaryLabel", label: "Main button text" },
      { key: "primaryHref", label: "Main button link", hint: "e.g. /washing-machines" },
      { key: "secondaryLabel", label: "WhatsApp button text", hint: "Leave blank to hide the button" },
      { key: "whatsappMessage", label: "WhatsApp pre-filled message" },
      { key: "image", label: "Background image", type: "image" },
    ],
    defaults: {
      eyebrow: "Steam wash · Washer-dryer · Heat-pump dryers",
      heading: "Steam-clean laundry, without the line-drying.",
      subheading: "Premium front-load washers, washer-dryer combos and heat-pump dryers — explained in plain language, delivered and installed.",
      primaryLabel: "Shop washing machines",
      primaryHref: "/washing-machines",
      secondaryLabel: "Ask on WhatsApp",
      whatsappMessage: "Hi, I'd like help choosing a washing machine.",
      image: "/images/hero.svg",
    },
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
      { icon: "🛡️", title: "Genuine warranty", text: "Terms stated on every product" },
      { icon: "🚚", title: "Free delivery & installation", text: "In selected zones" },
      { icon: "💳", title: "Flexible payment", text: "M-Pesa, Pay on Delivery, instalments" },
      { icon: "🏬", title: "Visit our showroom", text: "See it running before you pay" },
    ],
  },
  tiles: {
    kind: "list",
    group: "Homepage",
    title: "Category tiles",
    description: "The shop-by-category cards.",
    itemLabel: "Tile",
    fields: [
      { key: "label", label: "Title" },
      { key: "note", label: "Note" },
      { key: "href", label: "Link" },
      { key: "image", label: "Image", type: "image" },
    ],
    defaults: [
      { label: "Washing Machines", note: "8–12kg front & top load", href: "/washing-machines", image: "/images/washer.svg" },
      { label: "Washer-Dryer Combos", note: "Wash & dry in one", href: "/combos", image: "/images/combo.svg" },
      { label: "Tumble Dryers", note: "Heat-pump & condenser", href: "/dryers", image: "/images/dryer.svg" },
      { label: "Other Appliances", note: "Fridges, microwaves, budget washers", href: "/other-appliances", image: "/images/fridge.svg" },
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
      quizHeading: "Which machine is right for me?",
      quizText: "Answer five quick questions and get 1–3 recommendations in under a minute.",
      showroomHeading: "See it before you pay",
      showroomText: "Bring your laundry questions to the showroom. We'll run the machine, explain the programmes and confirm it fits your space.",
      showroomImage: "/images/showroom.svg",
    },
  },
  intros: {
    kind: "list",
    group: "Shop pages",
    title: "Category intros",
    description: "The 'who is this for' box at the top of a category page.",
    itemLabel: "Intro",
    fields: [
      { key: "section", label: "Category page", type: "select", options: ["washing-machines", "combos", "dryers", "other-appliances"] },
      { key: "title", label: "Heading" },
      { key: "points", label: "Points", type: "textarea", hint: "One point per line" },
    ],
    defaults: [
      {
        section: "combos",
        title: "Who is a washer-dryer combo for?",
        points:
          "Apartment dwellers with no balcony or space to line-dry — one machine washes and dries.\nBusy professionals who want clothes wearable the same evening.\nHouseholds wanting one machine instead of two: it dries smaller loads than it washes (e.g. 10kg wash / 7kg dry).",
      },
      {
        section: "dryers",
        title: "Who is a tumble dryer for?",
        points:
          "Heat-pump dryers use much less power, dry gently at low temperatures and need no vent pipe — ideal for apartments.\nCondenser dryers are a lower-cost way to dry in any weather; they also need no vent.\nFamilies with large laundry volume pair a dryer with a 10–12kg front-load washer.",
      },
    ],
  },
  productInfo: {
    kind: "object",
    group: "Shop pages",
    title: "Product page notes",
    description: "Text shared by every product page.",
    fields: [
      { key: "priceNote", label: "Note beside the stock badge" },
      { key: "inTheBox", label: "What's in the box", type: "textarea" },
      { key: "installNeeds", label: "Installation needs", type: "textarea", hint: "One requirement per line" },
    ],
    defaults: {
      priceNote: "Price confirmed on WhatsApp",
      inTheBox: "The machine, inlet hose, drain hose, user manual and warranty card.",
      installNeeds: "Water inlet tap (¾ inch) within 1.5m\nFloor drain or standpipe\n13A earthed socket",
    },
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
We help Kenyan households upgrade to premium automatic laundry machines — and understand exactly what they're buying. Machines at this price deserve a proper explanation, a chance to see them in person and an honest warranty.

## How we sell
- Real stock counts and honest offer dates — no fake countdowns.
- Talk to a person on WhatsApp, phone or in the showroom before you pay.
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
      body: `## Installation process
Our installer brings the machine in, connects the water inlet and drain, levels it, runs a short test cycle and shows you the main programmes.

## Site requirements
- Water inlet tap (¾ inch) within about 1.5m
- Floor drain or standpipe
- 13A earthed socket
- A clear path and a level floor

## Warranty
Warranty terms are stated on each product page. Where applicable, selected models carry a **10-year motor warranty** in addition to the general warranty. Keep your receipt — it's linked from your order page.
- General warranty: covers manufacturing defects (period stated per model).
- Not covered: damage from misuse, power surges without protection, or unauthorised repairs.

## Returns
See our [returns & refunds policy](/returns).

## After-sales
Call or WhatsApp us with your order number and we'll arrange a technician.`,
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

## 6. Contact
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
When you place an order, book a visit, ask about instalments or send an enquiry, we collect your name, phone number, delivery address and, optionally, email. We record M-Pesa transaction codes only to match payments to orders. We never store card data.

## Why we collect it
- To process, deliver and install your order, and provide warranty support.
- To respond to enquiries, bookings and instalment requests (with your consent).
- To refer instalment enquiries to our financing partner, only with your consent.
- To measure site performance using analytics (Google Analytics, Meta Pixel) where enabled.

## Your rights
You may ask to access, correct or delete your personal data at any time by contacting us. We retain order records only as long as needed for warranty and legal obligations.

## Security
Our site uses HTTPS, role-restricted admin access and spam protection on forms.

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
Inspect your machine on delivery. If it is damaged or not working, tell the driver and contact us within 48 hours. We will repair, replace or refund.

## Change of mind
Unused, uninstalled machines in original packaging may be returned within 7 days of delivery. Delivery fees are non-refundable and a handling fee may apply.

## Not eligible
- Machines already installed and used (covered by warranty instead).
- Damage caused by misuse or unsuitable installation.

## Refunds
Approved refunds are paid by M-Pesa within 7 working days.`,
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
