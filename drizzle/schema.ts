import { boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Table des clients du studio
 */
export const clients = mysqlTable("clients", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  userId: int("userId").notNull(), // propriétaire (FK vers users)
  nom: varchar("nom", { length: 100 }).notNull(),
  prenom: varchar("prenom", { length: 100 }).notNull(),
  dateNaissance: varchar("dateNaissance", { length: 10 }).notNull(), // YYYY-MM-DD
  adresse: text("adresse"),
  codePostal: varchar("codePostal", { length: 10 }),
  ville: varchar("ville", { length: 100 }),
  telephone: varchar("telephone", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }),
  pieceIdentiteType: mysqlEnum("pieceIdentiteType", ["CNI", "Passeport", "Permis", "Autre"]),
  pieceIdentiteNumero: varchar("pieceIdentiteNumero", { length: 50 }),
  estMineur: boolean("estMineur").default(false).notNull(),
  estArchive: boolean("estArchive").default(false).notNull(),
  dateArchivage: varchar("dateArchivage", { length: 10 }),
  dateConsentement: varchar("dateConsentement", { length: 10 }),
  dateSuppressionPrevue: varchar("dateSuppressionPrevue", { length: 10 }).notNull(),
  rgpdDroitsExerces: json("rgpdDroitsExerces").$type<Array<{type: string; date: string; note?: string}>>().default([]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Table des prestations
 */
export const prestations = mysqlTable("prestations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  clientId: varchar("clientId", { length: 36 }).notNull(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  type: mysqlEnum("type", ["piercing", "tatouage", "dermographie"]).notNull(),
  zone: varchar("zone", { length: 200 }).notNull(),
  description: text("description"),
  photos: json("photos").$type<string[]>().default([]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Prestation = typeof prestations.$inferSelect;
export type InsertPrestation = typeof prestations.$inferInsert;

/**
 * Table des documents clients
 */
export const documents = mysqlTable("documents", {
  id: varchar("id", { length: 36 }).primaryKey(),
  clientId: varchar("clientId", { length: 36 }).notNull(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["empty", "filled", "signed"]).default("empty").notNull(),
  data: json("data").$type<Record<string, unknown>>().default({}),
  signatureClient: text("signatureClient"),
  signatureProfessionnel: text("signatureProfessionnel"),
  signatureRepresentant: text("signatureRepresentant"),
  dateSigned: varchar("dateSigned", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Table des rendez-vous
 */
export const rendezVous = mysqlTable("rendez_vous", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull(),
  clientId: varchar("clientId", { length: 36 }),
  clientNom: varchar("clientNom", { length: 200 }),
  clientTelephone: varchar("clientTelephone", { length: 20 }),
  date: varchar("date", { length: 10 }).notNull(),
  heureDebut: varchar("heureDebut", { length: 5 }).notNull(),
  heureFin: varchar("heureFin", { length: 5 }).notNull(),
  type: mysqlEnum("type", ["piercing", "tatouage", "dermographie", "consultation", "retouche", "autre"]).notNull(),
  zone: varchar("zone", { length: 200 }),
  notes: text("notes"),
  statut: mysqlEnum("statut", ["confirme", "en_attente", "annule", "termine"]).default("confirme").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RendezVous = typeof rendezVous.$inferSelect;
export type InsertRendezVous = typeof rendezVous.$inferInsert;

/**
 * Table des paramètres du salon
 */
export const salonSettings = mysqlTable("salon_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  nom: varchar("nom", { length: 200 }).notNull().default("Mon Studio"),
  raisonSociale: varchar("raisonSociale", { length: 200 }),
  adresse: text("adresse"),
  codePostal: varchar("codePostal", { length: 10 }),
  ville: varchar("ville", { length: 100 }),
  telephone: varchar("telephone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  siret: varchar("siret", { length: 20 }),
  nomPierceur: varchar("nomPierceur", { length: 200 }),
  nomTatoueur: varchar("nomTatoueur", { length: 200 }),
  nomDermographe: varchar("nomDermographe", { length: 200 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SalonSettings = typeof salonSettings.$inferSelect;
export type InsertSalonSettings = typeof salonSettings.$inferInsert;

/**
 * Table de configuration SMTP pour l'envoi d'emails
 */
export const smtpConfig = mysqlTable("smtp_config", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  host: varchar("host", { length: 200 }).notNull().default("smtp.ionos.fr"),
  port: int("port").notNull().default(587),
  secure: boolean("secure").default(false).notNull(), // true = SSL port 465, false = STARTTLS port 587
  user: varchar("user", { length: 320 }).notNull().default(""),
  password: text("password").notNull().default(""), // stocké chiffré en production
  fromName: varchar("fromName", { length: 200 }),
  replyTo: varchar("replyTo", { length: 320 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SmtpConfig = typeof smtpConfig.$inferSelect;
export type InsertSmtpConfig = typeof smtpConfig.$inferInsert;

/**
 * Table des utilisateurs locaux du studio (créés par l'admin)
 * Distincts des comptes OAuth — accès par login + mot de passe
 */
export const studioUsers = mysqlTable("studio_users", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(), // FK vers users.id (le propriétaire du studio)
  prenom: varchar("prenom", { length: 100 }).notNull(),
  nom: varchar("nom", { length: 100 }).notNull(),
  login: varchar("login", { length: 100 }).notNull(), // identifiant de connexion
  passwordHash: text("passwordHash").notNull(), // bcrypt hash
  role: mysqlEnum("role", ["admin", "employe", "stagiaire"]).default("employe").notNull(),
  actif: boolean("actif").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudioUser = typeof studioUsers.$inferSelect;
export type InsertStudioUser = typeof studioUsers.$inferInsert;

/**
 * Configuration SMS Brevo (ex-Sendinblue)
 */
export const smsConfig = mysqlTable("sms_config", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  apiKey: text("apiKey").notNull(),
  senderName: varchar("senderName", { length: 11 }).default("Studio").notNull(), // max 11 chars pour SMS
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SmsConfig = typeof smsConfig.$inferSelect;
export type InsertSmsConfig = typeof smsConfig.$inferInsert;
