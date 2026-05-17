import { eq, desc, and } from "drizzle-orm";
import { encrypt, decrypt, encryptStr, decryptStr } from "./_core/crypto";

const CLIENT_SENSITIVE_FIELDS = ['telephone', 'email', 'dateNaissance', 'nomRepresentantLegal', 'prenomRepresentantLegal', 'telephoneRepresentantLegal'] as const;

function encryptClient<T extends Record<string, any>>(data: T): T {
  const result = { ...data };
  for (const field of CLIENT_SENSITIVE_FIELDS) {
    if (result[field]) result[field] = encryptStr(result[field]);
  }
  return result;
}

function decryptClient<T extends Record<string, any>>(data: T): T {
  const result = { ...data };
  for (const field of CLIENT_SENSITIVE_FIELDS) {
    if (result[field]) result[field] = decryptStr(result[field]);
  }
  return result;
}
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, clients, prestations, documents, rendezVous, salonSettings, studios, smtpConfig, studioUsers, smsConfig, licenses, adminArticles, adminArticleReads, adminNotifications, sharedServices } from "../drizzle/schema";
import type { InsertClient, InsertPrestation, InsertDocument, InsertRendezVous, InsertSalonSettings, InsertSmtpConfig, InsertStudioUser, InsertSmsConfig } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const mysql = await import('mysql2/promise');
      const pool = mysql.createPool({ 
        uri: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      _db = drizzle(pool);
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

export async function getClientsByUserId(userId: number, employeeId?: number) {
  const db = await getDb();
  if (!db) return [];
  // Note: employeeId parameter is ignored as the schema doesn't have this field
  // All clients are retrieved for the user
  const rows = await db.select().from(clients).where(eq(clients.userId, userId)).orderBy(desc(clients.createdAt));
  return rows.map(decryptClient);
}

export async function getClientById(clientId: string, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.userId, userId)))
    .limit(1);
  if (!result[0]) return undefined;
  return decryptClient(result[0]);
}

export async function createClient(data: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(clients).values(encryptClient(data));
  return data;
}

export async function updateClientById(clientId: string, userId: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clients).set(encryptClient(data)).where(and(eq(clients.id, clientId), eq(clients.userId, userId)));
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
  const rows = await db.select().from(documents)
    .where(and(eq(documents.clientId, clientId), eq(documents.userId, userId)))
    .orderBy(desc(documents.createdAt));
  return rows.map(r => ({ ...r, data: decrypt(r.data as any) }));
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
  if (!result[0]) return undefined;
  return { ...result[0], data: decrypt(result[0].data as any) };
}

export async function createDocument(data: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const encrypted = { ...data, data: encrypt(data.data as Record<string, unknown>) as any };
  await db.insert(documents).values(encrypted);
  return data;
}

export async function updateDocumentById(docId: string, userId: number, data: Partial<InsertDocument>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const toSave = data.data ? { ...data, data: encrypt(data.data as Record<string, unknown>) as any } : data;
  await db.update(documents).set(toSave).where(and(eq(documents.id, docId), eq(documents.userId, userId)));
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

  const settingsRows = await db.select().from(salonSettings).where(eq(salonSettings.userId, userId)).limit(1);
  const studioRows = await db.select().from(studios).where(eq(studios.userId, userId)).limit(1);
  const settings = settingsRows[0];
  const studio = studioRows[0];

  if (!settings && !studio) return undefined;

  return {
    ...(settings || {}),
    ...(studio && !settings ? {
      userId,
      nom: studio.nom,
      raisonSociale: studio.raisonSociale,
      adresse: studio.adresse,
      codePostal: studio.codePostal,
      ville: studio.ville,
      telephone: studio.telephone,
      email: studio.email,
      siret: studio.siret,
      siren: (studio as any).siren,
    } : {}),
    specialites: studio?.specialites,
  };
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
    hasPinSet: studioUsers.pinHash,
    specialite: studioUsers.specialite,
    typeContrat: studioUsers.typeContrat,
    dateEntree: studioUsers.dateEntree,
    dateSortie: studioUsers.dateSortie,
    adresse: studioUsers.adresse,
    createdAt: studioUsers.createdAt,
    updatedAt: studioUsers.updatedAt,
  }).from(studioUsers).where(eq(studioUsers.ownerId, ownerId)).then(rows => rows.map(row => ({ ...row, hasPinSet: Boolean(row.hasPinSet) })));
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

export async function updateStudioUser(id: number, ownerId: number, data: Partial<Pick<InsertStudioUser, 'prenom' | 'nom' | 'login' | 'passwordHash' | 'pinHash' | 'role' | 'actif' | 'specialite' | 'typeContrat' | 'dateEntree' | 'dateSortie' | 'adresse'>>) {
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

// ============================================================
// Fonctions multi-clients (inscription par email/mot de passe)
// ============================================================

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] ?? null;
}

export async function createUserWithEmail(data: {
  email: string;
  passwordHash: string;
  name: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const openId = `email:${data.email}`;
  await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email,
    loginMethod: "email",
    role: "user",
    lastSignedIn: new Date(),
  });
  const user = await getUserByEmail(data.email);
  if (!user) throw new Error("Failed to create user");
  await upsertSalonSettings(user.id, { nom: data.name, passwordHash: data.passwordHash } as any);
  return user;
}

export async function getPasswordHashByEmail(email: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const user = await getUserByEmail(email);
  if (!user) return null;

  // Correction 2026-05-09 : le mot de passe salon est désormais géré par
  // users.passwordHash dans les routes d'administration. L'ancien emplacement
  // salon_settings.passwordHash reste accepté uniquement en compatibilité.
  const userPasswordHash = (user as any)?.passwordHash;
  if (typeof userPasswordHash === "string" && userPasswordHash.length > 0) {
    return userPasswordHash;
  }

  const settings = await getSalonSettings(user.id);
  return (settings as any)?.passwordHash ?? null;
}

// ============ LICENCES ============

export async function getLicenseByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const { licenses } = await import('../drizzle/schema');
  const result = await db.select().from(licenses).where(eq(licenses.userId, userId)).limit(1);
  return result[0];
}

export async function upsertLicense(userId: number, data: Partial<typeof licenses.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  const { licenses } = await import('../drizzle/schema');
  const existing = await getLicenseByUserId(userId);
  if (existing) {
    await db.update(licenses).set({ ...data, updatedAt: new Date() }).where(eq(licenses.userId, userId));
  } else {
    await db.insert(licenses).values({ userId, ...data } as any);
  }
}

export async function getAllLicenses() {
  const db = await getDb();
  if (!db) return [];
  const { licenses } = await import('../drizzle/schema');
  return db.select().from(licenses).orderBy(desc(licenses.createdAt));
}

// ============ ARTICLES ADMIN ============

export async function getAdminArticles(statut?: string) {
  const db = await getDb();
  if (!db) return [];
  const { adminArticles } = await import('../drizzle/schema');
  if (statut) {
    return db.select().from(adminArticles)
      .where(eq(adminArticles.statut, statut as any))
      .orderBy(desc(adminArticles.createdAt));
  }
  return db.select().from(adminArticles).orderBy(desc(adminArticles.createdAt));
}

export async function getAdminArticleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const { adminArticles } = await import('../drizzle/schema');
  const result = await db.select().from(adminArticles).where(eq(adminArticles.id, id)).limit(1);
  return result[0];
}

export async function createAdminArticle(data: {
  titre: string;
  contenu: string;
  type: 'annonce' | 'mise_a_jour' | 'legal' | 'formation' | 'promo';
  statut: 'brouillon' | 'publie' | 'archive';
  ciblePlanType?: string;
  important?: boolean;
  publieLe?: Date;
  expireLe?: Date;
  createdByUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  const { adminArticles } = await import('../drizzle/schema');
  await db.insert(adminArticles).values(data as any);
}

export async function updateAdminArticle(id: number, data: Partial<{
  titre: string;
  contenu: string;
  type: 'annonce' | 'mise_a_jour' | 'legal' | 'formation' | 'promo';
  statut: 'brouillon' | 'publie' | 'archive';
  ciblePlanType: string;
  important: boolean;
  publieLe: Date;
  expireLe: Date;
}>) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  const { adminArticles } = await import('../drizzle/schema');
  await db.update(adminArticles).set({ ...data, updatedAt: new Date() } as any).where(eq(adminArticles.id, id));
}

export async function deleteAdminArticle(id: number) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  const { adminArticles } = await import('../drizzle/schema');
  await db.delete(adminArticles).where(eq(adminArticles.id, id));
}

export async function markArticleRead(articleId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  const { adminArticleReads } = await import('../drizzle/schema');
  // Vérifier si déjà lu
  const existing = await db.select().from(adminArticleReads)
    .where(and(eq(adminArticleReads.articleId, articleId), eq(adminArticleReads.userId, userId)))
    .limit(1);
  if (existing.length === 0) {
    await db.insert(adminArticleReads).values({ articleId, userId });
  }
}

export async function getArticleReadIds(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const { adminArticleReads } = await import('../drizzle/schema');
  const result = await db.select({ articleId: adminArticleReads.articleId })
    .from(adminArticleReads).where(eq(adminArticleReads.userId, userId));
  return result.map(r => r.articleId);
}

// ============ NOTIFICATIONS ADMIN ============

export async function createAdminNotification(data: {
  titre: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  targetUserId?: number;
  targetPlanType?: string;
  createdByUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  const { adminNotifications } = await import('../drizzle/schema');
  await db.insert(adminNotifications).values(data as any);
}

export async function getNotificationsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { adminNotifications } = await import('../drizzle/schema');
  // Notifs pour cet utilisateur spécifique OU pour tous (targetUserId = null)
  const result = await (db as any).$client.query(
    'SELECT * FROM admin_notifications WHERE (targetUserId IS NULL OR targetUserId = ?) ORDER BY createdAt DESC LIMIT 20',
    [userId]
  );
  return Array.isArray(result) ? result[0] as any[] : [];
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) return;
  const { adminNotifications } = await import('../drizzle/schema');
  await db.update(adminNotifications).set({ lu: true, luAt: new Date() }).where(eq(adminNotifications.id, id));
}

export async function getAllAdminNotifications() {
  const db = await getDb();
  if (!db) return [];
  const { adminNotifications } = await import('../drizzle/schema');
  return db.select().from(adminNotifications).orderBy(desc(adminNotifications.createdAt));
}

// ============ SERVICES PARTAGÉS ============

export async function getSharedServices(actifOnly = true) {
  const db = await getDb();
  if (!db) return [];
  const { sharedServices } = await import('../drizzle/schema');
  if (actifOnly) {
    return db.select().from(sharedServices).where(eq(sharedServices.actif, true)).orderBy(sharedServices.nom);
  }
  return db.select().from(sharedServices).orderBy(sharedServices.nom);
}

export async function createSharedService(data: {
  nom: string;
  description?: string;
  type: 'piercing' | 'tatouage' | 'dermographie';
  zone?: string;
  prixConseille?: number;
  dureeMinutes?: number;
  createdByUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  const { sharedServices } = await import('../drizzle/schema');
  await db.insert(sharedServices).values(data as any);
}

export async function updateSharedService(id: number, data: Partial<{
  nom: string;
  description: string;
  type: 'piercing' | 'tatouage' | 'dermographie';
  zone: string;
  prixConseille: number;
  dureeMinutes: number;
  actif: boolean;
}>) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  const { sharedServices } = await import('../drizzle/schema');
  await db.update(sharedServices).set({ ...data, updatedAt: new Date() } as any).where(eq(sharedServices.id, id));
}

export async function deleteSharedService(id: number) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  const { sharedServices } = await import('../drizzle/schema');
  await db.delete(sharedServices).where(eq(sharedServices.id, id));
}

// ============ STATS ADMIN ============

export async function getAdminStats() {
  if (!process.env.DATABASE_URL) return { totalStudios: 0, totalClients: 0, licenseStats: [] };
  try {
    const mysql2 = await import("mysql2/promise");
    const conn = await mysql2.createConnection(process.env.DATABASE_URL);
    const [sr] = await conn.query("SELECT COUNT(*) as total FROM users WHERE role != 'admin'") as any;
    const [cr] = await conn.query("SELECT COUNT(*) as total FROM clients") as any;
    const [lr] = await conn.query("SELECT status, planType, COUNT(*) as count FROM licenses GROUP BY status, planType") as any;
    await conn.end();
    return { totalStudios: sr[0]?.total||0, totalClients: cr[0]?.total||0, licenseStats: lr };
  } catch(e) { return { totalStudios: 0, totalClients: 0, licenseStats: [] }; }
  try {
    const [studioCount] = await (db as any).$client.query('SELECT COUNT(*) as total FROM users WHERE role != "admin"');
    const [clientCount] = await (db as any).$client.query('SELECT COUNT(*) as total FROM clients');
    const [licenseStats] = await (db as any).$client.query(
      'SELECT status, planType, COUNT(*) as count FROM licenses GROUP BY status, planType'
    );
    const rows = Array.isArray(studioCount) ? studioCount[0] : [];
    const clientRows = Array.isArray(clientCount) ? clientCount[0] : [];
    const licRows = Array.isArray(licenseStats) ? licenseStats[0] : [];
    return {
      totalStudios: (rows as any)[0]?.total || 0,
      totalClients: (clientRows as any)[0]?.total || 0,
      licenseStats: licRows as any[],
    };
  } catch { return { totalStudios: 0, totalClients: 0, licenseStats: [] }; }
}

// ─── Archives Numérisées ────────────────────────────────────────────────────
export async function getArchivesNumerisees(userId: number) {
  const mysql = await import('mysql2/promise');
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  try {
    const [rows] = await conn.execute('SELECT id, user_id, nom, prenom, date_numerisation as dateNumerisation, type_document as typeDocument, praticien, periode, notes, photos, created_at as createdAt FROM archives_numerisees WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return (rows as any[]).map(r => ({ ...r, photos: typeof r.photos === "string" ? JSON.parse(r.photos) : r.photos || [] }));
  } finally {
    await conn.end();
  }
}

export async function createArchiveNumerisee(userId: number, data: any) {
  const mysql = await import('mysql2/promise');
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  try {
    const [result] = await conn.execute(
      'INSERT INTO archives_numerisees (user_id, nom, prenom, date_numerisation, type_document, praticien, periode, notes, photos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, data.nom||'', data.prenom||'', data.dateNumerisation||'', data.typeDocument||'', data.praticien||'', data.periode||'', data.notes||'', JSON.stringify(data.photos||[])]
    );
    return result;
  } finally {
    await conn.end();
  }
}

export async function deleteArchiveNumerisee(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error('DB');
  await db.execute('DELETE FROM archives_numerisees WHERE id = ? AND user_id = ?', [id, userId]);
  return { success: true };
}

// ─── Engagements RGPD ───────────────────────────────────────────────────────
export async function getEngagementsRgpd(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const [rows] = await db.execute('SELECT * FROM engagements_rgpd WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return (rows as any[]).map(r => ({ ...r, photos: typeof r.photos === "string" ? JSON.parse(r.photos) : r.photos || [] }));
}

export async function createEngagementRgpd(userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error('DB');
  await db.execute(
    'INSERT INTO engagements_rgpd (user_id, nom, poste, date_signature, data) VALUES (?, ?, ?, ?, ?)',
    [userId, data.nom||'', data.poste||'', data.date||'', JSON.stringify(data)]
  );
  return { success: true };
}

export async function deleteEngagementRgpd(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error('DB');
  await db.execute('DELETE FROM engagements_rgpd WHERE id = ? AND user_id = ?', [id, userId]);
  return { success: true };
}

// ─── Traçabilité Photos ─────────────────────────────────────────────────────
export async function getTracabilitePhotos(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const [rows] = await db.execute('SELECT photos FROM tracabilite_photos WHERE user_id = ? LIMIT 1', [userId]) as any;
  if ((rows as any[]).length === 0) return [];
  try { return JSON.parse((rows as any[])[0].photos || '[]'); } catch { return []; }
}

export async function saveTracabilitePhotos(userId: number, photos: any[]) {
  const db = await getDb();
  if (!db) throw new Error('DB');
  const [rows] = await db.execute('SELECT id FROM tracabilite_photos WHERE user_id = ?', [userId]) as any;
  if ((rows as any[]).length === 0) {
    await db.execute('INSERT INTO tracabilite_photos (user_id, photos) VALUES (?, ?)', [userId, JSON.stringify(photos)]);
  } else {
    await db.execute('UPDATE tracabilite_photos SET photos = ? WHERE user_id = ?', [JSON.stringify(photos), userId]);
  }
  return { success: true };
}
