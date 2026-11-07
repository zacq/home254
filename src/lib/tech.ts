export type TechFeature = {
  id: string;
  name: string;
  icon: string;
  tag: string | null; // product feature tag used for "machines with this feature"
  what: string;
  benefit: string;
  benefitLabel: string;
};

export const TECH_FEATURES: TechFeature[] = [
  {
    id: "spacare",
    name: "SpaCare steam wash",
    icon: "♨️",
    tag: "SpaCare steam wash",
    what: "The machine injects hot steam into the drum before and during the wash. Steam relaxes fabric fibres and loosens dirt, sweat and allergens so detergent works better at lower temperatures.",
    benefit: "Cleaner, more hygienic clothes — ideal for baby clothes, bedding and school uniforms — with fewer creases.",
    benefitLabel: "Cleaner & more hygienic",
  },
  {
    id: "bldc",
    name: "BLDC inverter motor",
    icon: "⚙️",
    tag: "Inverter motor",
    what: "A brushless direct-drive motor has no carbon brushes and no belt. A controller adjusts speed precisely during wash and spin instead of running flat-out.",
    benefit: "Much quieter, uses less electricity and lasts longer — which is why many models carry a 10-year motor warranty.",
    benefitLabel: "Quieter & lasts longer",
  },
  {
    id: "energy",
    name: "Energy rating (A to A+++)",
    icon: "⚡",
    tag: null,
    what: "The energy label compares how much power and water a machine uses per cycle. A+++ is the most efficient class.",
    benefit: "An A+++ machine costs noticeably less to run every month, which narrows the price gap over the years you own it.",
    benefitLabel: "Cheaper to run",
  },
  {
    id: "auto-dose",
    name: "Auto-dose",
    icon: "💧",
    tag: "Auto-dose",
    what: "Fill the built-in tank with detergent and softener once. The machine senses the load and dispenses the right amount for each wash.",
    benefit: "No more over-dosing, less wasted detergent, and clothes rinse cleaner.",
    benefitLabel: "Saves detergent",
  },
  {
    id: "microfiber-catcher",
    name: "Microfiber catcher",
    icon: "🧵",
    tag: "Microfiber catcher",
    what: "A filter in the drain path traps loose fibres and lint shed by synthetic clothing before wastewater leaves the machine.",
    benefit: "Protects your drain from clogs and reduces microplastic pollution. Simply empty the catcher now and then.",
    benefitLabel: "Protects drains & environment",
  },
  {
    id: "drum-clean",
    name: "Drum clean",
    icon: "🌀",
    tag: "Drum clean",
    what: "A dedicated high-temperature, high-water cycle flushes detergent residue and limescale from the drum and seal.",
    benefit: "Stops musty smells and keeps clothes smelling fresh, so the machine lasts longer.",
    benefitLabel: "Fresher & longer lasting",
  },
  {
    id: "heat-pump",
    name: "Heat-pump drying",
    icon: "🌡️",
    tag: "Heat pump",
    what: "A heat-pump dryer recycles warm air in a closed loop and removes moisture, instead of heating fresh air and blowing it out of a vent.",
    benefit: "Uses far less power than a standard dryer, dries at lower temperatures so clothes last longer, and needs no vent pipe — perfect for apartments.",
    benefitLabel: "Lower power, gentle, no vent",
  },
  {
    id: "quick-wash",
    name: "Quick 15' wash",
    icon: "⏱️",
    tag: "Quick 15'",
    what: "A short cycle that refreshes lightly worn clothes in about fifteen minutes.",
    benefit: "Ideal when you need a shirt or school uniform for tomorrow.",
    benefitLabel: "Faster turnaround",
  },
];

export const FAQS = [
  {
    q: "Will the machine work with my water pressure?",
    a: "Front-load machines need normal mains water pressure. If you rely on a tank, ask us — we'll check the tank height on WhatsApp before you pay.",
  },
  {
    q: "What do I need ready for installation?",
    a: "A water inlet tap (¾ inch), a floor drain or standpipe, and a 13A earthed socket within about 1.5m. Our installer checks everything on the day.",
  },
  {
    q: "Is a washer-dryer combo as good as a separate washer and dryer?",
    a: "A combo is perfect when you lack space or can't line-dry. It dries smaller loads than it washes (e.g. 10kg wash / 7kg dry). For very large families a separate washer and heat-pump dryer is faster.",
  },
  {
    q: "Is the warranty genuine?",
    a: "Warranty terms are stated on every product page, including the 10-year motor warranty where it applies. You receive a receipt and warranty details with your delivery.",
  },
  {
    q: "Can I pay in instalments?",
    a: "Yes — send us the instalment enquiry form and our financing partner will contact you. Approval and terms are decided by the partner.",
  },
];
