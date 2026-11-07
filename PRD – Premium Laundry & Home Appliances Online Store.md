# PRD – Premium Laundry & Home Appliances Online Store

Nov 7, 2026 · @ActionPulse.ai

## 1. Overview & problem statement

We are building a mobile-first online store that sells premium laundry appliances in Kenya, led by MIKA front-load washers, washer-dryer combos and heat-pump dryers, with fridges, microwaves and an entry-level washer range as secondary categories. Success means turning online interest into paid orders, showroom visits and financing enquiries, not just page views.

**The problem.** Premium machines in this category sell at around KSh 100,000 and above (e.g. a MIKA 10kg wash / 7kg dry combo, model MWAFCV3310BDS, is shelf-priced at KSh 114,995). Buyers at that price:

- Do not understand the feature labels on the machine (SpaCare steam wash, BLDC inverter motor, A+++, heat pump) or why they justify the price.
- Want to talk to a person, see the machine, and be sure the warranty is genuine before paying.
- Often need to spread the cost through instalments.
- Research on their phone, usually via Instagram, TikTok, Google or WhatsApp, then message before buying.

Most local appliance sites are catalogue-only: a photo, a price and a cart. They don't explain, don't reassure and don't route the buyer to a salesperson at the moment of doubt.

**The product.** A store that educates (technology explainers, buying quiz, comparison), reassures (warranty, installation, reviews, showroom) and converts through the channel each buyer prefers: online checkout, WhatsApp, a phone call, a showroom booking or a financing request.

**Product name:** \[Store Name\] (placeholder until branding is confirmed).

## 2. Goals, success metrics & non-goals

The store succeeds if it produces qualified sales conversations and paid orders at a measurable cost per lead. Targets below are proposed starting points to be confirmed after the first 60 days of data.

**Business goals**

1. Generate a steady flow of qualified enquiries (WhatsApp, call, form, showroom booking) for premium laundry machines.
2. Close paid orders online and through WhatsApp, with M-Pesa or Pay on Delivery.
3. Make financing visible so price is not the reason a buyer drops off.
4. Build organic search presence for high-intent queries ("MIKA washing machine price Kenya", "washer dryer combo Nairobi").
5. Give the owner a simple admin to run products, prices, stock and orders without a developer.

**Success metrics (proposed)**

| Metric | Definition | Proposed target (first 90 days) |
| --- | --- | --- |
| Lead conversion rate | Leads (WhatsApp click, call click, form, booking) ÷ sessions | 3–5% |
| Order conversion rate | Paid or confirmed orders ÷ sessions | 0.5–1% |
| Lead-to-order rate | Orders ÷ qualified leads | 15–25% |
| Financing enquiries | Instalment form submissions per month | Track baseline |
| Mobile page speed | Largest Contentful Paint on 4G, mid/low Android | Under 2.5 s |
| Organic traffic | Sessions from Google search per month | Grow month on month |
| Admin self-sufficiency | Product/price updates done without developer | 100% |

**Non-goals (v1)**

- Multi-vendor marketplace or third-party sellers.
- Full card payment gateway (added later if volume justifies it).
- Native mobile app.
- In-house credit scoring; financing is routed to a partner.
- Spare-parts store and repair booking (later phase).
- Delivery outside agreed zones without a manual quote.

## 3. Target users & personas

The primary buyer is an urban, mobile-first household upgrading to a premium automatic machine; every flow is designed for a phone first.

| Persona | Who they are | What they need from the site | Main conversion path |
| --- | --- | --- | --- |
| Apartment professional | 28–40, Nairobi apartment, no space or time to line-dry | Washer-dryer combo, size that fits, quiet operation, delivery and installation | WhatsApp → M-Pesa |
| Growing family | Household of 4–6, high laundry volume | 10–12kg capacity, hygiene (steam wash for baby clothes), running cost | Comparison → showroom visit or financing |
| Upgrader from twin-tub | Owns a twin-tub, wants automatic | Plain explanation of what changes, water and power needs, price justification | Buying quiz → WhatsApp |
| Gift / diaspora buyer | Buying for parents in Kenya, often abroad | Trust, clear delivery to a named address, receipt and warranty | WhatsApp or call → online payment |
| Budget buyer | Wants a reliable machine near KSh 30–40K | Entry-level range, Pay on Delivery | Cart checkout or WhatsApp |
| Store admin (internal) | Owner or sales staff | Update products, prices, stock; see and act on orders and leads fast | Admin panel + WhatsApp notifications |

**Shared constraints:** mostly on Android phones, some on low-end devices and patchy data; prefer WhatsApp to email; trust M-Pesa; expect to negotiate or ask questions before paying.

## 4. Scope & release phases

The MVP launches the full selling loop for laundry machines (browse, learn, ask, pay, deliver); everything else waits until real orders show what to build next.

| Capability | MVP (Phase 1) | Phase 2 | Phase 3 |
| --- | --- | --- | --- |
| Catalogue | Washers, combos, dryers + basic other appliances | Full fridges/microwaves range | Spare parts, accessories |
| Product pages | Photos, specs, price, warranty, CTAs | Product video, 360° view | User Q&A |
| Education | Technology Explained page, buying guide | Interactive "Which machine?" quiz | Blog / SEO content hub |
| Comparison | — | Compare up to 3 machines | Saved comparisons |
| Checkout | Cart, M-Pesa Till/Paybill (manual confirm), Pay on Delivery | M-Pesa STK Push (Daraja API) auto-confirm | Card payments |
| Financing | Instalment enquiry form | Partner integration (e.g. bank / lipa-pole-pole provider) | Online pre-approval |
| WhatsApp | Pre-filled order button on every product | WhatsApp Business catalogue sync | WhatsApp API order updates |
| Showroom | Location, map, booking form | Calendar slots with SMS reminders | — |
| Reviews | Admin-added reviews + installed-unit photos | Verified buyer reviews | — |
| Admin | Products, prices, stock, orders, leads | Offers/coupons, delivery zones | Reports dashboard |
| Analytics | GA4 + Meta Pixel + CTA click events | Conversion API, funnel reports | — |

**Out of scope for all phases (unless re-decided):** marketplace sellers, native app, in-house lending.

## 5. Site map & information architecture

The site has three paths under Home (shop, learn, trust), and all of them point the buyer to a product page, a WhatsApp chat or checkout.

&#91;embedded content: site map · 3 paths, 16 pages\]

Main navigation (mobile menu, in this order): Washing Machines · Combos · Dryers · Other Appliances · Which Machine? · Payment Options · Showroom · Contact.

## 6. Functional requirements by page

Every page carries a persistent mobile action bar (WhatsApp · Call · Cart) so a buyer can reach a person from anywhere in one tap. IDs (FR-x) are for tracking in build tickets.

**Global**

- FR-1 Sticky header: logo, search, cart count, menu.
- FR-2 Sticky bottom action bar on mobile: WhatsApp, Call, Cart.
- FR-3 Floating WhatsApp button on desktop.
- FR-4 Footer: contacts, showroom address, opening hours, payment logos (M-Pesa, Pay on Delivery), warranty/returns links, social links.
- FR-5 Site search by product name, brand, model number (e.g. "MWAFCV3310BDS") and capacity.

**Home**

- FR-6 Hero banner: steam-wash / washer-dryer message, one primary CTA ("Shop washing machines") and one secondary ("Ask on WhatsApp").
- FR-7 Trust strip: genuine warranty, free delivery & installation (zones), flexible payment, showroom.
- FR-8 Featured models carousel (admin-selected), current offers, category tiles (Washers, Combos, Dryers, Other appliances).
- FR-9 "Which machine is right for me?" entry block and short reviews block.

**Washing Machines (category)**

- FR-10 Grid of product cards: photo, name, capacity, key badge (e.g. "Steam wash", "Washer-dryer"), price, stock status, WhatsApp button.
- FR-11 Filters: type (front-load, washer-dryer, top-load), capacity (8–12kg), features (steam wash, inverter motor, dryer function), price range, brand.
- FR-12 Sort: popular, price low–high, price high–low, newest.
- FR-13 "Add to compare" toggle on each card (Phase 2).

**Washer-Dryer Combos** and **Tumble Dryers**

- FR-14 Category intro block explaining who the product is for (apartments, no line-drying; heat-pump = lower power, no vent pipe, gentle drying), then the same grid and filters.

**Other Appliances**

- FR-15 Sub-categories: fridges, microwaves, entry-level washers; same card and grid components.

**Product page**

- FR-16 Image gallery (zoom, swipe) and optional product video.
- FR-17 Title, brand, model number, price, offer price (if any), stock status.
- FR-18 Key spec block: capacity (wash/dry), type, spin speed (RPM), energy rating, motor type, warranty.
- FR-19 Feature icons linking to the Technology Explained anchors (SpaCare, BLDC, auto-dose, microfiber catcher, drum clean, heat pump).
- FR-20 CTAs: Buy Now, Order on WhatsApp (pre-filled), Call, Book Showroom Visit, Ask about instalments.
- FR-21 Delivery & installation estimate by area; what's in the box; installation requirements (water inlet, drain, socket).
- FR-22 Full spec table, dimensions, and downloadable manual/brochure (if supplied).
- FR-23 Reviews and related products.

**Technology Explained**

- FR-24 One section per feature: plain-language name, one visual, what it does, the benefit (cleaner, cheaper to run, quieter, lasts longer), and "machines with this feature" link.

**Which Machine Is Right for Me?**

- FR-25 MVP: written guide by household size and space. Phase 2: 4–5 question quiz (household size, space, need drying?, budget, priority) returning 1–3 recommended models with CTAs.

**Payment Options**

- FR-26 Explain M-Pesa (Till/Paybill), Pay on Delivery (zones and conditions), instalment options; link to financing form.

**Delivery, Installation & Warranty**

- FR-27 Delivery zones and fees table, timelines, installation process and site requirements, warranty terms per brand (incl. 10-year motor warranty where applicable), returns policy, after-sales contact.

**Showroom & Reviews**

- FR-28 Showroom photos, address, hours, embedded Google Map, booking form; customer reviews with photos of installed units.

**About Us / Contact Us**

- FR-29 Business story and dealer status; contact page with phone, WhatsApp, email, map and enquiry form.

**Legal pages**

- FR-30 Terms of sale, privacy policy (Kenya Data Protection Act compliant), returns & refunds.

## 7. Commerce: cart, checkout, payments, financing, orders

Checkout is guest-only, one page, and asks for nothing the delivery team doesn't need; payment is M-Pesa or Pay on Delivery at launch.

**Cart**

- CM-1 Add/remove items, change quantity, see subtotal, delivery fee (by zone) and total in KSh.
- CM-2 Optional add-ons per item: installation (free/paid by zone), extended warranty, stand/pedestal (if stocked).
- CM-3 Cart persists on the device (no login required).

**Checkout (guest, single page)**

- CM-4 Fields: full name, phone (07xx/01xx validated), email (optional), delivery area (dropdown of zones), address/landmark, preferred delivery date, installation yes/no, notes.
- CM-5 Payment choice: M-Pesa or Pay on Delivery (only shown for eligible zones and below an admin-set order value cap).
- CM-6 Order summary and terms checkbox; "Place order" button.

**Payments**

- CM-7 MVP M-Pesa: show Till/Paybill number and the order number as account reference; buyer pays and enters the M-Pesa code; admin confirms the payment manually.
- CM-8 Phase 2 M-Pesa: STK Push via Safaricom Daraja API; callback auto-marks the order Paid.
- CM-9 Pay on Delivery: order is Confirmed after a sales call; payment collected on delivery via M-Pesa.
- CM-10 Optional deposit rule for high-value or out-of-zone orders (admin-set percentage).

**Financing**

- CM-11 "Ask about instalments" form on product pages and Payment page: name, phone, product, preferred plan length, employment type, consent to be contacted.
- CM-12 Submissions go to the leads list and trigger a WhatsApp/email alert to sales; partner handles approval offline in v1.
- CM-13 Show indicative monthly amounts only if the financing partner supplies approved rates; otherwise show "plans available, ask us".

**Order lifecycle**

| Status | Set by | Customer notified |
| --- | --- | --- |
| New | System on submit | Yes (SMS/WhatsApp: order received + payment instructions) |
| Awaiting payment | System (M-Pesa chosen) | Reminder after 2 hours if unpaid |
| Paid / Confirmed | Admin or M-Pesa callback | Yes (confirmation + delivery window) |
| Scheduled for delivery | Admin | Yes (date + driver contact) |
| Delivered & installed | Admin | Yes (thank you + review request) |
| Cancelled / Refunded | Admin | Yes |

- CM-14 Order number format e.g. ORD-2026-00123; receipt viewable via a private link.
- CM-15 Admin receives instant alert (email + WhatsApp/SMS) for every new order and lead.

## 8. Conversion features

Every conversion action is tracked as an analytics event and, where it creates a lead, lands in the admin leads list with its source page.

**WhatsApp ordering**

- CV-1 "Order on WhatsApp" on every product card and page opens wa.me/\<business number> with a pre-filled message: *"Hi, I'm interested in the MIKA 10/7kg Washer-Dryer Combo (MWAFCV3310BDS) at KSh 114,995. Is it available for delivery to \[area\]?"*
- CV-2 Generic WhatsApp button elsewhere pre-fills the current page name.
- CV-3 Click logged as event `whatsapp_click` with product ID and page.

**Click-to-call**

- CV-4 `tel:` links on header, action bar, product page and contact page; event `call_click`.

**Showroom visit / demo booking**

- CV-5 Form: name, phone, preferred date, time slot (morning/afternoon/evening), product of interest.
- CV-6 Confirmation message on screen and via SMS/WhatsApp; admin alert; Phase 2 adds reminders the day before.

**Comparison (Phase 2)**

- CV-7 Compare up to 3 machines side by side: price, capacity (wash/dry), type, spin speed, energy rating, motor, steam wash, warranty, dimensions.
- CV-8 Highlight differences; CTA under each column.

**"Which machine?" quiz (Phase 2)**

- CV-9 4–5 questions, one per screen, progress bar, under 60 seconds to finish.
- CV-10 Rules-based recommendation (e.g. household of 5+ and needs drying → 10kg+ washer-dryer combo); result page shows 1–3 models with WhatsApp/Buy CTAs.
- CV-11 Optional "send my result on WhatsApp" captures the phone number as a lead.

**Trust and urgency (honest only)**

- CV-12 Stock badges driven by real stock counts (In stock / Only X left / Out of stock + "Notify me").
- CV-13 Offer badges with real end dates set in admin; no fake countdowns.
- CV-14 Reviews and installed-unit photos near the CTAs on product pages.
- CV-15 Exit/scroll prompt on product pages (once per session): "Questions? Chat with us on WhatsApp".

## 9. Admin panel & content management

A non-technical owner must be able to add a new machine, change a price or mark something out of stock from a phone in under 2 minutes.

| Module | Capabilities | Phase |
| --- | --- | --- |
| Products | Add/edit/archive, photos (auto-compressed), video link, specs from a fixed template, feature tags, category, featured flag | MVP |
| Prices & offers | Price, offer price with start/end date, offer badge text | MVP |
| Stock | Quantity per product, low-stock threshold, auto badge | MVP |
| Orders | List with status filter, order detail, change status (triggers customer message), add M-Pesa code, print delivery note | MVP |
| Leads | One inbox for WhatsApp-tracked clicks (count only), forms, showroom bookings, financing enquiries; status: New / Contacted / Won / Lost; assign to staff | MVP |
| Content | Edit homepage banners, Technology Explained sections, FAQs, delivery zones and fees, policies, reviews | MVP |
| Delivery zones | Zone name, fee, Pay on Delivery allowed, lead time | MVP |
| Users & roles | Owner (all), Sales (orders, leads), Content (products, pages) | MVP |
| Reports | Orders and revenue by period, top products, leads by source, conversion by channel | Phase 2 |
| Coupons | Code, value, expiry, usage limit | Phase 2 |

- AD-1 Every change is logged (who, what, when).
- AD-2 Admin works fully on mobile.
- AD-3 CSV import/export for products and orders.

## 10. Product data model & catalogue

Every product follows one fixed spec template so filters, comparison and the quiz work without manual tagging.

**Product fields**

| Field | Type | Example |
| --- | --- | --- |
| name | text | MIKA Washer-Dryer Combo 10/7kg, Silver |
| brand | select | MIKA |
| model\_number | text (unique) | MWAFCV3310BDS |
| category | select | Washer-dryer combo |
| type | select | Front-load / Top-load / Twin-tub / Heat-pump dryer |
| wash\_capacity\_kg | number | 10 |
| dry\_capacity\_kg | number (optional) | 7 |
| spin\_rpm | number | 1500 |
| energy\_rating | select | A, A+, A++, A+++ |
| motor | select | Brushless inverter (BLDC) / Standard |
| features | multi-select | SpaCare steam wash, Auto-dose, Microfiber catcher, Drum clean, Baby care, Quick 15', Heat pump |
| warranty | text | e.g. 10-year motor warranty (where applicable) + general warranty |
| price\_ksh | number | 114,995 |
| offer\_price\_ksh / offer\_end | number / date | optional |
| stock\_qty / low\_stock\_at | number | 4 / 2 |
| colour, dimensions\_cm, weight\_kg | text / number | Silver; W×D×H |
| images, video\_url, manual\_pdf | media | — |
| short\_benefit, description | text | One-line benefit + full copy |
| seo\_title, meta\_description, slug | text | auto-filled, editable |

**Seed catalogue (from the showroom photos)**

| Model | Type | Capacity | Spin | Energy | Notable features | Price |
| --- | --- | --- | --- | --- | --- | --- |
| MIKA MWAFCV3310BDS | Washer-dryer combo, front-load | 10kg wash / 7kg dry | 1500 RPM | A | BLDC inverter, SpaCare steam wash, Ozone/Airwash, auto-dose | KSh 114,995 (shelf) |
| MIKA 12kg front-load (model no. to confirm) | Front-load washer | 12kg | 1400 RPM | A+++ | BLDC inverter, SpaCare steam wash, microfiber catcher, 10-year warranty badge | To confirm |
| MIKA MDRH3110DS (to confirm) | Heat-pump tumble dryer | 10kg | — | A+++ | BLDC inverter, heat pump, hygiene/anti-crease, 10-year warranty badge | To confirm |

The catalogue needs at least 10–15 laundry products at launch so filters and comparison feel useful; the owner supplies prices, stock and model numbers.

**Other entities:** Order, OrderItem, Customer (phone as key), Lead (type, source page, product, status, owner), Booking, FinancingEnquiry, DeliveryZone, Review, Offer, AdminUser, AuditLog.

## 11. Non-functional requirements

The site must load fast on a mid/low-end Android phone over 4G, because that is where most buyers will meet it.

**Performance**

- NF-1 Largest Contentful Paint under 2.5 s and total page weight under 1.5 MB on product pages (mobile, 4G).
- NF-2 Images served as WebP/AVIF, responsive sizes, lazy-loaded below the fold; videos load only on tap.
- NF-3 Lighthouse mobile score of 85+ for Performance, Accessibility, Best Practices and SEO.

**SEO**

- NF-4 Clean URLs (/washing-machines/mika-10-7kg-washer-dryer-mwafcv3310bds), unique titles and meta descriptions, one H1 per page.
- NF-5 Product, Offer, Review and LocalBusiness structured data (schema.org).
- NF-6 XML sitemap, robots.txt, canonical tags, Google Search Console and Google Business Profile linked.
- NF-7 Keyword-led pages and copy for: "MIKA washing machine price Kenya", "washer dryer combo Nairobi", "heat pump dryer Kenya", "12kg front load washing machine Kenya".

**Security & privacy**

- NF-8 HTTPS everywhere; admin behind strong passwords + 2FA; role-based access.
- NF-9 No card data stored; M-Pesa codes and phone numbers stored only as needed for orders.
- NF-10 Consent checkbox on forms; privacy policy aligned with the Kenya Data Protection Act, 2019; data deletion on request.
- NF-11 Daily backups, spam protection on forms (honeypot / reCAPTCHA).

**Accessibility & usability**

- NF-12 WCAG 2.1 AA basics: contrast, tap targets ≥ 44 px, labelled form fields, alt text on product images.
- NF-13 Prices always in KSh with thousands separators; English copy, with key CTAs testable in Swahili later.

**Analytics**

- NF-14 GA4 + Meta Pixel with events: view\_item, add\_to\_cart, begin\_checkout, purchase, whatsapp\_click, call\_click, booking\_submit, financing\_submit, quiz\_complete.
- NF-15 UTM tracking on all ad and social links; Meta Conversions API in Phase 2.

**Reliability**

- NF-16 99.5% uptime target; uptime monitoring with alerts to the owner.

## 12. Tech stack options & integrations

Recommended: WooCommerce for the fastest path to a self-managed store with M-Pesa; choose the custom build only if the store must double as a showcase product or needs the quiz and lead inbox tightly built in.

| Option | Stack | Strengths | Trade-offs | Fit |
| --- | --- | --- | --- | --- |
| A. WooCommerce | WordPress + WooCommerce, M-Pesa plugin (STK Push), WhatsApp plugin, Yoast/RankMath SEO | Owner-editable, strong SEO, many Kenyan M-Pesa plugins, low cost | Plugin sprawl, needs good hosting and caching for speed | Best default |
| B. Shopify | Shopify + M-Pesa payment app + WhatsApp app | Hosted, reliable, polished admin | Monthly fees in USD, M-Pesa via third-party apps, less control over custom flows | Good if owner wants zero maintenance |
| C. Custom | Next.js + Supabase/Postgres + Daraja API + headless CMS (e.g. Sanity) on Vercel/Netlify | Fastest pages, quiz, comparison and leads inbox built exactly to spec | Higher build time and cost, developer needed for changes outside the CMS | Best performance and flexibility |

**Integrations (all options)**

- Safaricom Daraja API (M-Pesa STK Push + callbacks) or approved plugin.
- WhatsApp: wa.me deep links (MVP); WhatsApp Business API via a provider for automated order messages (Phase 3).
- SMS: Africa's Talking or equivalent for order and booking messages.
- Email: transactional sender (e.g. Brevo, Postmark) for receipts and admin alerts.
- Google Maps embed, Google Analytics 4, Google Search Console, Meta Pixel.
- Financing partner: referral form in v1; API only if the partner offers one.
- Hosting: managed host with Nairobi/EU proximity and CDN (e.g. Cloudflare).

## 13. User flows

Buyers reach a confirmed order by three routes (self-checkout, WhatsApp/call, or showroom/financing), and the store must support all three equally.

&#91;embedded content: purchase flows · 3 routes to one order\]

**Flow details**

1. **Self-checkout:** product page → Buy Now → cart → checkout form → M-Pesa (enter code) or Pay on Delivery → order received message → admin confirms → delivery scheduled → delivered and installed → review request.
2. **WhatsApp / call:** product page → pre-filled WhatsApp message or call → sales confirms stock, delivery area and price → sales creates the order in admin (source: WhatsApp) → M-Pesa or Pay on Delivery → same tail as above.
3. **Showroom / financing:** booking or financing form → lead appears in admin with product and source → sales follows up within the target time → visit or partner approval → order created → same tail.
4. **Quiz (Phase 2):** quiz → 1–3 recommended models → product page or "send on WhatsApp" → joins route 1 or 2.
5. **Admin:** new order/lead alert → open in admin → update status → customer is messaged automatically.

## 14. Risks, dependencies & open questions

The biggest risk is not technical: it is whether the store can legitimately use MIKA branding and promise the official warranty.

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Not an authorised MIKA dealer | Cannot use MIKA logos/claims or promise official warranty; trust damage | Confirm dealer status in writing; otherwise brand as an independent retailer and state warranty terms precisely |
| Prices change often | Stale prices lose trust or margin | Admin price edits in under 2 minutes; "price confirmed on WhatsApp" note |
| M-Pesa manual confirmation delays | Buyers wait, abandon | Phase 2 STK Push; clear payment instructions; staff alerts |
| Pay on Delivery fraud / no-shows | Wasted delivery trips | Phone confirmation call, zone limits, value cap, deposit rule |
| Slow pages on low-end phones | Lost traffic and ad spend | Performance budget (NF-1 to NF-3), image pipeline |
| WhatsApp leads not followed up | Interest leaks away | Leads inbox, response-time target (under 15 min in business hours), staff assignment |
| Thin catalogue at launch | Filters and comparison look empty | Minimum 10–15 laundry products before launch |
| Financing partner not ready | Main objection unanswered | Launch with enquiry form; sign partner in Phase 2 |

**Dependencies:** product photos/videos and spec sheets, final price list, delivery zones and fees, Till/Paybill numbers, Daraja API credentials (Phase 2), showroom address and hours, financing partner, domain and hosting, brand assets.

**Open questions**

- [ ] Are we an authorised MIKA dealer, and which other brands will we carry?
- [ ] Store name, domain and brand look?
- [ ] Is there a physical showroom, and where?
- [ ] Which delivery zones, fees and installation charges apply?
- [ ] Which financing partner(s), and what terms can we display?
- [ ] Exact warranty terms per model (general vs 10-year motor)?
- [ ] Which stack: WooCommerce, Shopify or custom?
- [ ] Who on the team handles WhatsApp leads and in which hours?

## 15. Timeline & acceptance criteria

The proposed plan launches the MVP in week 5, provided the owner's content (prices, photos, zones, dealer status) is ready by the end of week 1.

&#91;embedded content: proposed roadmap · 4 phases, 2 gates\]

The build cannot start in earnest until content is in; most delays on stores like this come from missing photos and price lists, not code.

**MVP acceptance criteria (all must pass before launch)**

- [ ] At least 10–15 laundry products live with photos, full specs, price, stock and warranty.
- [ ] Filters (type, capacity, features, price) return correct results on the Washing Machines page.
- [ ] Every product's WhatsApp button opens a pre-filled message with model number and price.
- [ ] Click-to-call works on Android and iPhone.
- [ ] A test order completes with M-Pesa (code entry) and with Pay on Delivery; admin and customer both receive notifications.
- [ ] Order status changes in admin trigger the right customer message.
- [ ] Showroom booking and financing forms land in the admin leads list and alert sales.
- [ ] Admin can add a product and change a price from a phone in under 2 minutes.
- [ ] Product pages hit LCP under 2.5 s on a mid-range Android over 4G; Lighthouse mobile 85+.
- [ ] GA4 and Meta Pixel record view\_item, add\_to\_cart, purchase, whatsapp\_click, call\_click and form submits.
- [ ] Sitemap submitted, structured data validated, Google Business Profile linked.
- [ ] Privacy policy, terms, returns and warranty pages published.
- [ ] Staff trained on admin, lead follow-up and the WhatsApp response target.
