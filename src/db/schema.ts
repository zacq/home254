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
    // washers | combos | dryers | fridges | microwaves | entry-washers
    category: text("category").notNull(),
    type: text("type").notNull().default("Front-load"),
    washCapacityKg: integer("wash_capacity_kg"),
    dryCapacityKg: integer("dry_capacity_kg"),
    spinRpm: integer("spin_rpm"),
    energyRating: text("energy_rating"),
    motor: text("motor").notNull().default("Standard"),
    features: text("features").array().notNull().default([]),
    warranty: text("warranty").notNull().default("2-year general warranty"),
    priceKsh: integer("price_ksh").notNull(),
    offerPriceKsh: integer("offer_price_ksh"),
    offerStart: timestamp("offer_start"),
    offerEnd: timestamp("offer_end"),
    offerBadge: text("offer_badge"),
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
    popularity: integer("popularity").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("products_model_idx").on(t.modelNumber),
    uniqueIndex("products_slug_idx").on(t.slug),
  ],
);

export const deliveryZones = pgTable(
  "delivery_zones",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    fee: integer("fee").notNull().default(0),
    installFee: integer("install_fee").notNull().default(0),
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
    installation: boolean("installation").notNull().default(false),
    notes: text("notes"),
    paymentMethod: text("payment_method").notNull(), // mpesa | pod
    status: text("status").notNull().default("new"),
    subtotal: integer("subtotal").notNull(),
    addonsTotal: integer("addons_total").notNull().default(0),
    deliveryFee: integer("delivery_fee").notNull().default(0),
    installFee: integer("install_fee").notNull().default(0),
    total: integer("total").notNull(),
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
  name: text("name").notNull(),
  location: text("location"),
  rating: integer("rating").notNull().default(5),
  body: text("body").notNull(),
  imageUrl: text("image_url"),
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
    role: text("role").notNull().default("sales"), // owner | sales | content
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
