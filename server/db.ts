import { eq, and, gte, lte, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, clients, contacts, deliveryTickets, deliveryUnits, monthlyReports, deliverySites, clientUnits } from "../drizzle/schema";
import type { InsertClient, InsertContact, InsertDeliveryTicket, InsertDeliveryUnit, InsertMonthlyReport, InsertDeliverySite, InsertClientUnit } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER HELPERS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    mustChangePassword: users.mustChangePassword,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn,
  }).from(users).orderBy(desc(users.createdAt));
}

export async function createUserWithPassword(data: {
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  mustChangePassword?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const openId = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const result = await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    loginMethod: 'password',
    role: data.role,
    mustChangePassword: data.mustChangePassword ?? 1,
    lastSignedIn: new Date(),
  });
  return result[0].insertId;
}

export async function updateUserPassword(id: number, passwordHash: string, mustChangePassword = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ passwordHash, mustChangePassword, updatedAt: new Date() }).where(eq(users.id, id));
}

export async function updateUserLastSignedIn(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, id));
}

export async function updateUserRole(id: number, role: 'user' | 'admin') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id));
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(users).where(eq(users.id, id));
}

// ============ CLIENT HELPERS ============

export async function getAllClients() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clients).orderBy(desc(clients.createdAt));
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getClientByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(eq(clients.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createClient(data: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clients).values(data);
  return result[0].insertId;
}

export async function updateClient(id: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clients).set(data).where(eq(clients.id, id));
}

export async function deleteClient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clients).where(eq(clients.id, id));
}

// ============ CONTACT HELPERS ============

export async function getContactsByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contacts).where(eq(contacts.clientId, clientId));
}

export async function createContact(data: InsertContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contacts).values(data);
  return result[0].insertId;
}

export async function updateContact(id: number, data: Partial<InsertContact>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contacts).set(data).where(eq(contacts.id, id));
}

export async function deleteContact(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(contacts).where(eq(contacts.id, id));
}

// ============ DELIVERY TICKET HELPERS ============

export async function getTicketsByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deliveryTickets).where(eq(deliveryTickets.clientId, clientId)).orderBy(desc(deliveryTickets.deliveryDate));
}

export async function getTicketsByClientIdAndMonth(clientId: number, year: number, month: number) {
  const db = await getDb();
  if (!db) return [];
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  return db.select().from(deliveryTickets)
    .where(and(
      eq(deliveryTickets.clientId, clientId),
      gte(deliveryTickets.deliveryDate, startDate),
      lte(deliveryTickets.deliveryDate, endDate)
    ))
    .orderBy(desc(deliveryTickets.deliveryDate));
}

export async function createDeliveryTicket(data: InsertDeliveryTicket) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(deliveryTickets).values(data);
  return result[0].insertId;
}

export async function getAllTickets() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deliveryTickets).orderBy(desc(deliveryTickets.deliveryDate));
}

export async function getTicketById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const results = await db.select().from(deliveryTickets).where(eq(deliveryTickets.id, id)).limit(1);
  return results[0] ?? null;
}

// ============ DELIVERY UNIT HELPERS ============

export async function getUnitsByTicketId(ticketId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deliveryUnits).where(eq(deliveryUnits.ticketId, ticketId));
}

export async function createDeliveryUnit(data: InsertDeliveryUnit) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(deliveryUnits).values(data);
  return result[0].insertId;
}

export async function createDeliveryUnits(units: InsertDeliveryUnit[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (units.length === 0) return;
  await db.insert(deliveryUnits).values(units);
}

export async function deleteDeliveryUnit(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(deliveryUnits).where(eq(deliveryUnits.id, id));
}

/**
 * Rapport par unité : retourne tous les remplissages d'un client
 * groupés par nom d'unité, avec date et litres pour chaque remplissage.
 * Filtre optionnel par année et mois.
 */
export async function getUnitReportByClient(
  clientId: number,
  year?: number,
  month?: number
): Promise<Array<{ unitName: string; totalLiters: number; fills: Array<{ date: Date; liters: number; ticketNumber: string; ticketId: number }> }>> {
  const db = await getDb();
  if (!db) return [];

  // Récupérer tous les tickets du client dans la période
  let tickets;
  if (year && month) {
    tickets = await getTicketsByClientIdAndMonth(clientId, year, month);
  } else if (year) {
    // Toute l'année
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);
    tickets = await db.select().from(deliveryTickets).where(
      and(
        eq(deliveryTickets.clientId, clientId),
        gte(deliveryTickets.deliveryDate, startDate),
        lte(deliveryTickets.deliveryDate, endDate)
      )
    );
  } else {
    tickets = await db.select().from(deliveryTickets).where(eq(deliveryTickets.clientId, clientId));
  }

  if (!tickets.length) return [];

  // Récupérer toutes les unités pour ces tickets
  const ticketIds = tickets.map((t: any) => t.id);
  const allUnits: Array<typeof deliveryUnits.$inferSelect> = [];
  for (const ticketId of ticketIds) {
    const units = await db.select().from(deliveryUnits).where(eq(deliveryUnits.ticketId, ticketId));
    allUnits.push(...units);
  }

  if (!allUnits.length) return [];

  // Construire un index ticket par id
  const ticketMap = new Map(tickets.map((t: any) => [t.id, t]));

  // Grouper par unitName
  const grouped = new Map<string, { totalLiters: number; fills: Array<{ date: Date; liters: number; ticketNumber: string; ticketId: number }> }>();
  for (const unit of allUnits) {
    const ticket = ticketMap.get(unit.ticketId);
    if (!ticket) continue;
    const liters = parseFloat(unit.liters as string || '0');
    if (!grouped.has(unit.unitName)) {
      grouped.set(unit.unitName, { totalLiters: 0, fills: [] });
    }
    const entry = grouped.get(unit.unitName)!;
    entry.totalLiters += liters;
    entry.fills.push({
      date: new Date(ticket.deliveryDate),
      liters,
      ticketNumber: ticket.ticketNumber,
      ticketId: ticket.id,
    });
  }

  // Trier les remplissages par date et retourner trié par nom d'unité
  return Array.from(grouped.entries())
    .map(([unitName, data]) => ({
      unitName,
      totalLiters: data.totalLiters,
      fills: data.fills.sort((a, b) => a.date.getTime() - b.date.getTime()),
    }))
    .sort((a, b) => a.unitName.localeCompare(b.unitName, 'fr'));
}

// ============ DELIVERY SITES HELPERS ============

export async function getSitesByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deliverySites).where(eq(deliverySites.clientId, clientId));
}

export async function getSitesByClientCode(clientCode: string): Promise<{ client: typeof clients.$inferSelect; sites: (typeof deliverySites.$inferSelect)[] } | null> {
  const db = await getDb();
  if (!db) return null;
  const clientRows = await db.select().from(clients).where(eq(clients.code, clientCode));
  if (!clientRows.length) return null;
  const sites = await db.select().from(deliverySites).where(
    and(eq(deliverySites.clientId, clientRows[0].id), eq(deliverySites.isActive, 1))
  );
  return { client: clientRows[0], sites };
}

export async function createDeliverySite(data: Omit<InsertDeliverySite, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(deliverySites).values(data);
  return result[0].insertId;
}

export async function updateDeliverySite(id: number, data: Partial<Omit<InsertDeliverySite, 'id' | 'clientId' | 'createdAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(deliverySites).set(data).where(eq(deliverySites.id, id));
}

export async function deleteDeliverySite(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(deliverySites).where(eq(deliverySites.id, id));
}

// ============ MONTHLY REPORT HELPERS ============

export async function getMonthlyReportsByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(monthlyReports)
    .where(eq(monthlyReports.clientId, clientId))
    .orderBy(desc(monthlyReports.year), desc(monthlyReports.month));
}

export async function upsertMonthlyReport(data: InsertMonthlyReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(monthlyReports).values(data).onDuplicateKeyUpdate({
    set: {
      totalVolume: data.totalVolume,
      totalUnits: data.totalUnits,
      totalDeliveries: data.totalDeliveries,
      generatedAt: new Date(),
    },
  });
}

// ============ CLIENT UNITS HELPERS ============

export async function getClientUnitsByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientUnits)
    .where(and(eq(clientUnits.clientId, clientId), eq(clientUnits.isActive, 1)))
    .orderBy(clientUnits.sortOrder, clientUnits.unitName);
}

export async function getClientUnitsByClientCode(clientCode: string): Promise<{ client: typeof clients.$inferSelect; units: (typeof clientUnits.$inferSelect)[] } | null> {
  const db = await getDb();
  if (!db) return null;
  const clientRows = await db.select().from(clients).where(eq(clients.code, clientCode));
  if (!clientRows.length) return null;
  const units = await db.select().from(clientUnits).where(
    and(eq(clientUnits.clientId, clientRows[0].id), eq(clientUnits.isActive, 1))
  ).orderBy(clientUnits.sortOrder, clientUnits.unitName);
  return { client: clientRows[0], units };
}

export async function createClientUnit(data: Omit<InsertClientUnit, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clientUnits).values(data);
  return result[0].insertId;
}

export async function updateClientUnit(id: number, data: Partial<Omit<InsertClientUnit, 'id' | 'clientId' | 'createdAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clientUnits).set(data).where(eq(clientUnits.id, id));
}

export async function deleteClientUnit(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clientUnits).where(eq(clientUnits.id, id));
}
