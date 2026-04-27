import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }).default("password"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  mustChangePassword: int("mustChangePassword").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Clients table - represents customer companies
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 128 }),
  province: varchar("province", { length: 64 }),
  postalCode: varchar("postalCode", { length: 16 }),
  classe: varchar("classe", { length: 64 }),
  sousClasse: varchar("sousClasse", { length: 64 }),
  siteStatus: varchar("siteStatus", { length: 32 }).default("Active"),
  managementType: varchar("managementType", { length: 64 }),
  btuName: varchar("btuName", { length: 64 }),
  siteType: varchar("siteType", { length: 64 }).default("Delivery Location"),
  userId: int("userId"),
  aliases: text("aliases"),
  emailSender: varchar("emailSender", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Contacts table - contacts associated with clients
 */
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 128 }),
  phone: varchar("phone", { length: 32 }),
  extension: varchar("extension", { length: 16 }),
  email: varchar("email", { length: 320 }),
  isPrimary: int("isPrimary").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

/**
 * Delivery tickets (bordereaux) - individual delivery records
 */
export const deliveryTickets = mysqlTable("delivery_tickets", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  ticketNumber: varchar("ticketNumber", { length: 32 }).notNull(),
  locationCode: varchar("locationCode", { length: 32 }),
  volumeTotalDef: decimal("volumeTotalDef", { precision: 10, scale: 2 }).default("0"),
  volumeTotal: decimal("volumeTotal", { precision: 10, scale: 2 }).notNull(),
  pieces: int("pieces").default(1),
  duration: varchar("duration", { length: 16 }),
  deliveryDate: timestamp("deliveryDate").notNull(),
  emailSubject: varchar("emailSubject", { length: 512 }),
  emailReceivedAt: timestamp("emailReceivedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DeliveryTicket = typeof deliveryTickets.$inferSelect;
export type InsertDeliveryTicket = typeof deliveryTickets.$inferInsert;

/**
 * Monthly reports - generated summaries per client per month
 */
export const monthlyReports = mysqlTable("monthly_reports", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  month: int("month").notNull(),
  year: int("year").notNull(),
  totalVolume: decimal("totalVolume", { precision: 12, scale: 2 }).default("0"),
  totalUnits: int("totalUnits").default(0),
  totalDeliveries: int("totalDeliveries").default(0),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
});

export type MonthlyReport = typeof monthlyReports.$inferSelect;
export type InsertMonthlyReport = typeof monthlyReports.$inferInsert;
