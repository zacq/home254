import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    brand: text("brand").notNull().default("MIKA"),
    modelNumber: text("model_number").notNull(),
    slug: text("slug").notNull(),
    // Top-level category slug (tvs, audio, fridges, washers, cookers, …) and its sub-category slug.
    category: text("category").notNull(),
    subcategory: text("subcategory").notNull().default(""),
    type: text("type").notNull().default("Front-load"),
    // Category-specific attributes from the category's spec template (see lib/catalog.ts).
    specs: jsonb("specs").$type<Record<string, string>>().notNull().default({}),
    washCapacityKg: integer("wash_capacity_kg"),
    dryCapacityKg: integer("dry_capacity_kg"),
    spinRpm: integer("spin_rpm"),
    energyRating: text("energy_rating"),
    motor: text("motor").notNull().default("Standard"),
    features: text("features").array().notNull().default([]),
    warranty: text("warranty").notNull().default("2-year general warranty"),
    priceKsh: integer("price_ksh").notNull(),
    // A genuine prior or recommended price only (PRD PE-4).
    wasPriceKsh: integer("was_price_ksh"),
    costKsh: integer("cost_ksh"),
    competitorPriceKsh: integer("competitor_price_ksh"),
    competitorWasKsh: integer("competitor_was_ksh"),
    competitorCheckedAt: timestamp("competitor_checked_at"),
    offerPriceKsh: integer("offer_price_ksh"),
    offerStart: timestamp("offer_start"),
    offerEnd: timestamp("offer_end"),
    offerBadge: text("offer_badge"),
    // A flash sale is an offer with a quantity cap; it ends when the cap or the end time is reached.
    offerQtyCap: integer("offer_qty_cap"),
    offerSold: integer("offer_sold").notNull().default(0),
    stockQty: integer("stock_qty").notNull().default(0),
    lowStockAt: integer("low_stock_at").notNull().default(2),
    colour: text("colour"),
    dimensionsCm: text("dimensions_cm"),
    weightKg: integer("weight_kg"),
    images: text("images").array().notNull().default([]),
    videoUrl: text("video_url"),
    manualPdf: text("manual_pdf"),
    shortBenefit: text("short_benefit").notNull().default(""),
    description: text("description").notNull().default(""),
    seoTitle: text("seo_title"),
    metaDescription: text("meta_description"),
    featured: boolean("featured").notNull().default(false),
    archived: boolean("archived").notNull().default(false),
    isSample: boolean("is_sample").notNull().default(false),
    popularity: integer("popularity").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("products_model_idx").on(t.modelNumber),
    uniqueIndex("products_slug_idx").on(t.slug),
    index("products_category_idx").on(t.category),
  ],
);

export const categories = pgTable("categories", {
  slug: text("slug").primaryKey(), // "tvs" or "tvs/smart-tvs"
  parent: text("parent"),
  name: text("name").notNull(),
  tileImage: text("tile_image"),
  menuOrder: integer("menu_order").notNull().default(0),
  isCore: boolean("is_core").notNull().default(false),
  active: boolean("active").notNull().default(true),
  intro: text("intro"),
  marginFloorPct: integer("margin_floor_pct"),
});

export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    phone: text("phone").notNull(),
    name: text("name"),
    email: text("email"),
    tier: text("tier").notNull().default("bronze"),
    joinedAt: timestamp("joined_at"), // set when they join Rewards with a one-time code
    marketingConsent: boolean("marketing_consent").notNull().default(false),
    birthday: text("birthday"),
    lastPurchaseAt: timestamp("last_purchase_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("customers_phone_idx").on(t.phone)],
);

// Append-only: amounts never change. Status moves pending → available (delivery) or pending → void (cancel).
export const pointsLedger = pgTable(
  "points_ledger",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id").notNull(),
    orderId: integer("order_id"),
    type: text("type").notNull(), // earn | bonus | redeem | expire | reverse | adjust
    points: integer("points").notNull(),
    status: text("status").notNull().default("available"), // pending | available | void
    reason: text("reason"),
    actor: text("actor"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("ledger_customer_idx").on(t.customerId), index("ledger_order_idx").on(t.orderId)],
);

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: serial("id").primaryKey(),
    phone: text("phone").notNull(),
    codeHash: text("code_hash").notNull(),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("otp_phone_idx").on(t.phone)],
);

export const rewardCampaigns = pgTable("reward_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  multiplier: integer("multiplier").notNull().default(2),
  scope: text("scope").notNull().default("all"), // all | category | brand | product
  scopeValue: text("scope_value"),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  active: boolean("active").notNull().default(true),
});

export const promoCodes = pgTable(
  "promo_codes",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull(),
    kind: text("kind").notNull().default("amount"), // percent | amount | price_match
    value: integer("value").notNull(),
    productId: integer("product_id"),
    phone: text("phone"),
    minSubtotal: integer("min_subtotal").notNull().default(0),
    maxUses: integer("max_uses"),
    uses: integer("uses").notNull().default(0),
    startsAt: timestamp("starts_at"),
    endsAt: timestamp("ends_at"),
    active: boolean("active").notNull().default(true),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("promo_code_idx").on(t.code)],
);

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id").notNull(),
    productId: integer("product_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("wishlist_unique_idx").on(t.customerId, t.productId)],
);

export const installServices = pgTable("install_services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // top-level category slug it applies to
  price: integer("price").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const deliveryZones = pgTable(
  "delivery_zones",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    fee: integer("fee").notNull().default(0),
    freeAbove: integer("free_above"), // delivery is free when product value reaches this
    goldFree: boolean("gold_free").notNull().default(false), // free for Gold members (Platinum is free everywhere)
    installFee: integer("install_fee").notNull().default(0), // installation surcharge for this zone
    podAllowed: boolean("pod_allowed").notNull().default(false),
    leadTime: text("lead_time").notNull().default("1–2 days"),
    active: boolean("active").notNull().default(true),
  },
  (t) => [uniqueIndex("zones_name_idx").on(t.name)],
);

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    orderNumber: text("order_number").notNull(),
    token: text("token").notNull(),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    zoneId: integer("zone_id"),
    zoneName: text("zone_name").notNull(),
    address: text("address").notNull(),
    deliveryDate: text("delivery_date"),
    deliverySlot: text("delivery_slot"),
    installation: boolean("installation").notNull().default(false),
    installServices: jsonb("install_services").$type<{ name: string; price: number }[]>().notNull().default([]),
    notes: text("notes"),
    paymentMethod: text("payment_method").notNull(), // mpesa | pod
    status: text("status").notNull().default("new"),
    customerId: integer("customer_id"),
    subtotal: integer("subtotal").notNull(),
    savings: integer("savings").notNull().default(0),
    addonsTotal: integer("addons_total").notNull().default(0),
    deliveryFee: integer("delivery_fee").notNull().default(0),
    installFee: integer("install_fee").notNull().default(0),
    promoCode: text("promo_code"),
    promoDiscount: integer("promo_discount").notNull().default(0),
    pointsRedeemed: integer("points_redeemed").notNull().default(0),
    pointsEarned: integer("points_earned").notNull().default(0),
    total: integer("total").notNull(),
    driverName: text("driver_name"),
    driverPhone: text("driver_phone"),
    depositRequired: integer("deposit_required").notNull().default(0),
    mpesaCode: text("mpesa_code"),
    source: text("source").notNull().default("website"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("orders_number_idx").on(t.orderNumber),
    uniqueIndex("orders_token_idx").on(t.token),
    index("orders_status_idx").on(t.status),
  ],
);

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id"),
  name: text("name").notNull(),
  modelNumber: text("model_number").notNull(),
  category: text("category"),
  unitPrice: integer("unit_price").notNull(),
  qty: integer("qty").notNull(),
  extendedWarranty: boolean("extended_warranty").notNull().default(false),
  warrantyPrice: integer("warranty_price").notNull().default(0),
  pedestal: boolean("pedestal").notNull().default(false),
  pedestalPrice: integer("pedestal_price").notNull().default(0),
});

export const leads = pgTable(
  "leads",
  {
    id: serial("id").primaryKey(),
    // booking | financing | contact | notify | quiz
    type: text("type").notNull(),
    name: text("name"),
    phone: text("phone"),
    email: text("email"),
    sourcePage: text("source_page"),
    productId: integer("product_id"),
    productName: text("product_name"),
    details: jsonb("details").$type<Record<string, string>>().notNull().default({}),
    status: text("status").notNull().default("new"), // new|contacted|won|lost
    assignee: text("assignee"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("leads_status_idx").on(t.status)],
);

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    productId: integer("product_id"),
    page: text("page"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("events_name_idx").on(t.name)],
);

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id"),
  orderId: integer("order_id"),
  customerId: integer("customer_id"),
  name: text("name").notNull(),
  location: text("location"),
  rating: integer("rating").notNull().default(5),
  body: text("body").notNull(),
  imageUrl: text("image_url"),
  verified: boolean("verified").notNull().default(false), // written by the buyer of a delivered order
  reply: text("reply"),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  audience: text("audience").notNull(), // customer | admin
  channel: text("channel").notNull().default("whatsapp"),
  recipient: text("recipient"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  refType: text("ref_type"),
  refId: integer("ref_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  detail: text("detail"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const adminUsers = pgTable(
  "admin_users",
  {
    id: serial("id").primaryKey(),
    username: text("username").notNull(),
    name: text("name").notNull(),
    role: text("role").notNull().default("sales"), // owner | pricing | sales | content | fulfilment
    passwordHash: text("password_hash").notNull(),
    totpSecret: text("totp_secret"),
    totpEnabled: boolean("totp_enabled").notNull().default(false),
    active: boolean("active").notNull().default(true),
    failedLogins: integer("failed_logins").notNull().default(0),
    lockedUntil: timestamp("locked_until"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("admin_users_username_idx").on(t.username)],
);

export const content = pgTable("content", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Uploaded photos live in Postgres because Netlify functions have no persistent disk.
export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  contentType: text("content_type").notNull(),
  data: text("data").notNull(), // base64
  bytes: integer("bytes").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type DeliveryZone = typeof deliveryZones.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type LedgerEntry = typeof pointsLedger.$inferSelect;
export type PromoCode = typeof promoCodes.$inferSelect;
export type RewardCampaign = typeof rewardCampaigns.$inferSelect;
export type InstallService = typeof installServices.$inferSelect;
