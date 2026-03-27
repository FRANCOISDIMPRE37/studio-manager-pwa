import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, clients, prestations, documents, rendezVous, salonSettings, smtpConfig, studioUsers, smsConfig } from "../drizzle/schema";
import type { InsertClient, InsertPrestation, InsertDocument, InsertRendezVous, InsertSalonSettings, InsertSmtpConfig, InsertStudioUser, InsertSmsConfig } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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
    const values: InsertUser = {
      openId: user.openId,
    };
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

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ CLIENTS ============

export async function getClientsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clients).where(eq(clients.userId, userId)).orderBy(desc(clients.createdAt));
}

export async function getClientById(clientId: string, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.userId, userId)))
    .limit(1);
  return result[0];
}

export async function createClient(data: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(clients).values(data);
  return data;
}

export async function updateClientById(clientId: string, userId: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clients).set(data).where(and(eq(clients.id, clientId), eq(clients.userId, userId)));
}

export async function deleteClientById(clientId: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clients).where(and(eq(clients.id, clientId), eq(clients.userId, userId)));
}

// ============ PRESTATIONS ============

export async function getPrestationsByClientId(clientId: string, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(prestations)
    .where(and(eq(prestations.clientId, clientId), eq(prestations.userId, userId)))
    .orderBy(desc(prestations.createdAt));
}

export async function getPrestationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(prestations)
    .where(eq(prestations.userId, userId))
    .orderBy(desc(prestations.createdAt));
}

export async function createPrestation(data: InsertPrestation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(prestations).values(data);
  return data;
}

export async function deletePrestationById(prestationId: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(prestations).where(and(eq(prestations.id, prestationId), eq(prestations.userId, userId)));
}

// ============ DOCUMENTS ============

export async function getDocumentsByClientId(clientId: string, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents)
    .where(and(eq(documents.clientId, clientId), eq(documents.userId, userId)))
    .orderBy(desc(documents.createdAt));
}

export async function getDocumentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.createdAt));
}

export async function getDocumentById(docId: string, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(documents)
    .where(and(eq(documents.id, docId), eq(documents.userId, userId)))
    .limit(1);
  return result[0];
}

export async function createDocument(data: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(documents).values(data);
  return data;
}

export async function updateDocumentById(docId: string, userId: number, data: Partial<InsertDocument>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(documents).set(data).where(and(eq(documents.id, docId), eq(documents.userId, userId)));
}

// ============ RENDEZ-VOUS ============

export async function getRDVByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rendezVous).where(eq(rendezVous.userId, userId)).orderBy(desc(rendezVous.date));
}

export async function createRDV(data: InsertRendezVous) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(rendezVous).values(data);
  return data;
}

export async function updateRDVById(rdvId: string, userId: number, data: Partial<InsertRendezVous>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(rendezVous).set(data).where(and(eq(rendezVous.id, rdvId), eq(rendezVous.userId, userId)));
}

export async function deleteRDVById(rdvId: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(rendezVous).where(and(eq(rendezVous.id, rdvId), eq(rendezVous.userId, userId)));
}

// ============ SALON SETTINGS ============

export async function getSalonSettings(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(salonSettings).where(eq(salonSettings.userId, userId)).limit(1);
  return result[0];
}

export async function upsertSalonSettings(userId: number, data: Omit<InsertSalonSettings, 'id' | 'userId' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(salonSettings)
    .values({ userId, ...data })
    .onDuplicateKeyUpdate({ set: data });
}

// ============ SMTP CONFIG ============

export async function getSmtpConfig(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(smtpConfig).where(eq(smtpConfig.userId, userId)).limit(1);
  return result[0];
}

export async function upsertSmtpConfig(userId: number, data: Omit<InsertSmtpConfig, 'id' | 'userId' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(smtpConfig)
    .values({ userId, ...data })
    .onDuplicateKeyUpdate({ set: data });
}

// ============ STUDIO USERS (utilisateurs locaux) ============

export async function getStudioUsersByOwner(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: studioUsers.id,
    prenom: studioUsers.prenom,
    nom: studioUsers.nom,
    login: studioUsers.login,
    role: studioUsers.role,
    actif: studioUsers.actif,
    createdAt: studioUsers.createdAt,
    updatedAt: studioUsers.updatedAt,
  }).from(studioUsers).where(eq(studioUsers.ownerId, ownerId));
}

export async function getStudioUserById(id: number, ownerId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(studioUsers)
    .where(and(eq(studioUsers.id, id), eq(studioUsers.ownerId, ownerId)))
    .limit(1);
  return result[0];
}

export async function loginExistsForOwner(login: string, ownerId: number, excludeId?: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: studioUsers.id }).from(studioUsers)
    .where(and(eq(studioUsers.login, login), eq(studioUsers.ownerId, ownerId)))
    .limit(1);
  if (result.length === 0) return false;
  if (excludeId && result[0].id === excludeId) return false;
  return true;
}

export async function createStudioUser(data: InsertStudioUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(studioUsers).values(data);
}

export async function updateStudioUser(id: number, ownerId: number, data: Partial<Pick<InsertStudioUser, 'prenom' | 'nom' | 'login' | 'passwordHash' | 'role' | 'actif'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(studioUsers).set(data)
    .where(and(eq(studioUsers.id, id), eq(studioUsers.ownerId, ownerId)));
}

export async function deleteStudioUser(id: number, ownerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(studioUsers)
    .where(and(eq(studioUsers.id, id), eq(studioUsers.ownerId, ownerId)));
}

// ============ SMS CONFIG ============

export async function getSmsConfig(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(smsConfig).where(eq(smsConfig.userId, userId)).limit(1);
  return result[0];
}

export async function upsertSmsConfig(userId: number, data: Pick<InsertSmsConfig, 'apiKey' | 'senderName'>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.insert(smsConfig)
    .values({ userId, ...data })
    .onDuplicateKeyUpdate({ set: data });
}

// ============ RDV RAPPELS ============

export interface RdvRappel {
  id: string;
  userId: number;
  rdvId: string;
  rdvDate: string;
  rdvHeure: string;
  clientNom: string | null;
  clientEmail: string | null;
  sentAt: number;
  statut: 'envoye' | 'erreur' | 'ignore';
  errorMessage: string | null;
  createdAt: number;
}

export async function getRdvRappelsByUserId(userId: number): Promise<RdvRappel[]> {
  const db = await getDb();
  if (!db) return [];
  const [rows] = await (db as any).$client.execute(
    'SELECT * FROM rdv_rappels WHERE userId = ? ORDER BY createdAt DESC LIMIT 50',
    [userId]
  );
  return rows as RdvRappel[];
}

export async function rdvRappelExists(userId: number, rdvId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const [rows] = await (db as any).$client.execute(
    'SELECT id FROM rdv_rappels WHERE userId = ? AND rdvId = ? AND statut = "envoye" LIMIT 1',
    [userId, rdvId]
  );
  return (rows as any[]).length > 0;
}

export async function insertRdvRappel(rappel: RdvRappel): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await (db as any).$client.execute(
    `INSERT INTO rdv_rappels (id, userId, rdvId, rdvDate, rdvHeure, clientNom, clientEmail, sentAt, statut, errorMessage, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [rappel.id, rappel.userId, rappel.rdvId, rappel.rdvDate, rappel.rdvHeure, rappel.clientNom, rappel.clientEmail, rappel.sentAt, rappel.statut, rappel.errorMessage, rappel.createdAt]
  );
}
