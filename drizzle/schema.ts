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
  // Représentant légal (pour les mineurs)
  nomRepresentantLegal: varchar("nomRepresentantLegal", { length: 100 }),
  prenomRepresentantLegal: varchar("prenomRepresentantLegal", { length: 100 }),
  telephoneRepresentantLegal: varchar("telephoneRepresentantLegal", { length: 20 }),
  lienRepresentantLegal: varchar("lienRepresentantLegal", { length: 50 }),
  estArchive: boolean("estArchive").default(false).notNull(),
  estSalarie: boolean("est_salarie").default(false),
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
  pinHash: text("pinHash"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SalonSettings = typeof salonSettings.$inferSelect;;
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
  passwordHash: text("passwordHash").notNull(),
  pinHash: text("pinHash"), // bcrypt hash
  specialite: varchar("specialite", { length: 100 }), // piercing, tatouage, dermographie
  role: mysqlEnum("role", ["admin", "employe", "stagiaire"]).default("employe").notNull(),
  actif: boolean("actif").default(true).notNull(),
  isTemporary: boolean("isTemporary").default(true).notNull(),
  firstLogin: boolean("firstLogin").default(true).notNull(),
  specialites: json("specialites").$type<{piercing: boolean, tatouage: boolean, dermographie: boolean}>().default({piercing: true, tatouage: true, dermographie: true}),
  tempPin: varchar("tempPin", { length: 6 }),
  ownerEmail: varchar("ownerEmail", { length: 320 }),
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

/**
 * Table des studios (profil commercial de chaque studio client)
 * Chaque utilisateur propriétaire a un studio associé
 */
export const studios = mysqlTable("studios", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // FK vers users.id
  nom: varchar("nom", { length: 200 }).notNull().default("Mon Studio"),
  slug: varchar("slug", { length: 100 }).notNull().unique(), // identifiant URL unique ex: studio-dupont
  raisonSociale: varchar("raisonSociale", { length: 200 }),
  siret: varchar("siret", { length: 20 }),
  adresse: text("adresse"),
  codePostal: varchar("codePostal", { length: 10 }),
  ville: varchar("ville", { length: 100 }),
  telephone: varchar("telephone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  logoUrl: text("logoUrl"),
  planType: mysqlEnum("planType", ["trial", "solo", "studio", "multi"]).default("trial").notNull(),
  trialEndsAt: timestamp("trialEndsAt"),
  actif: boolean("actif").default(true).notNull(),
  isTemporary: boolean("isTemporary").default(true).notNull(),
  firstLogin: boolean("firstLogin").default(true).notNull(),
  specialites: json("specialites").$type<{piercing: boolean, tatouage: boolean, dermographie: boolean}>().default({piercing: true, tatouage: true, dermographie: true}),
  tempPin: varchar("tempPin", { length: 6 }),
  ownerEmail: varchar("ownerEmail", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Studio = typeof studios.$inferSelect;
export type InsertStudio = typeof studios.$inferInsert;

/**
 * Table des abonnements Stripe
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  studioId: int("studioId").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 100 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 100 }),
  stripePriceId: varchar("stripePriceId", { length: 100 }),
  planType: mysqlEnum("planType", ["solo", "studio", "multi"]).notNull(),
  status: mysqlEnum("status", ["active", "past_due", "canceled", "trialing", "unpaid"]).default("trialing").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Table des invitations (codes d'accès pour nouveaux studios)
 */
export const invitations = mysqlTable("invitations", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(), // code unique d'invitation
  email: varchar("email", { length: 320 }), // email destinataire (optionnel)
  planType: mysqlEnum("planType", ["trial", "solo", "studio", "multi"]).default("trial").notNull(),
  trialDays: int("trialDays").default(30).notNull(),
  usedByUserId: int("usedByUserId"), // null = pas encore utilisé
  usedAt: timestamp("usedAt"),
  expiresAt: timestamp("expiresAt"),
  createdByUserId: int("createdByUserId").notNull(), // super-admin qui a créé l'invitation
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = typeof invitations.$inferInsert;

/**
 * Table des licences — gestion centralisée des accès et expirations
 * Chaque studio a une licence qui détermine ses droits et sa date d'expiration
 */
export const licenses = mysqlTable("licenses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // FK vers users.id
  planType: mysqlEnum("planType", ["trial", "solo", "studio", "multi"]).default("trial").notNull(),
  status: mysqlEnum("status", ["active", "suspended", "expired", "cancelled"]).default("active").notNull(),
  expiresAt: timestamp("expiresAt"), // null = pas d'expiration (lifetime)
  // Fonctionnalités activées/désactivées
  featureClients: boolean("featureClients").default(true).notNull(),
  featureDocuments: boolean("featureDocuments").default(true).notNull(),
  featureAgenda: boolean("featureAgenda").default(true).notNull(),
  featureSms: boolean("featureSms").default(false).notNull(),
  featureMultiUsers: boolean("featureMultiUsers").default(false).notNull(),
  featureExport: boolean("featureExport").default(true).notNull(),
  maxClients: int("maxClients").default(100).notNull(), // 0 = illimité
  maxUsers: int("maxUsers").default(1).notNull(), // nb d'utilisateurs autorisés
  notes: text("notes"), // notes internes admin
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type License = typeof licenses.$inferSelect;
export type InsertLicense = typeof licenses.$inferInsert;

/**
 * Table des articles admin — contenu partagé diffusé à tous les studios
 * Annonces, mises à jour, informations légales, etc.
 */
export const adminArticles = mysqlTable("admin_articles", {
  id: int("id").autoincrement().primaryKey(),
  titre: varchar("titre", { length: 300 }).notNull(),
  contenu: text("contenu").notNull(),
  type: mysqlEnum("type", ["annonce", "mise_a_jour", "legal", "formation", "promo"]).default("annonce").notNull(),
  statut: mysqlEnum("statut", ["brouillon", "publie", "archive"]).default("brouillon").notNull(),
  // Ciblage
  ciblePlanType: varchar("ciblePlanType", { length: 100 }), // null = tous, ou 'trial,solo,studio,multi'
  important: boolean("important").default(false).notNull(), // afficher en priorité
  // Dates
  publieLe: timestamp("publieLe"),
  expireLe: timestamp("expireLe"), // null = pas d'expiration
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminArticle = typeof adminArticles.$inferSelect;
export type InsertAdminArticle = typeof adminArticles.$inferInsert;

/**
 * Table de suivi des lectures d'articles par les studios
 */
export const adminArticleReads = mysqlTable("admin_article_reads", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),
  userId: int("userId").notNull(),
  readAt: timestamp("readAt").defaultNow().notNull(),
});

export type AdminArticleRead = typeof adminArticleReads.$inferSelect;
export type InsertAdminArticleRead = typeof adminArticleReads.$inferInsert;

/**
 * Table des notifications admin — messages envoyés à des studios spécifiques ou tous
 */
export const adminNotifications = mysqlTable("admin_notifications", {
  id: int("id").autoincrement().primaryKey(),
  titre: varchar("titre", { length: 300 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["info", "warning", "success", "error"]).default("info").notNull(),
  // Destinataires
  targetUserId: int("targetUserId"), // null = tous les studios
  targetPlanType: varchar("targetPlanType", { length: 100 }), // null = tous les plans
  // Statut
  lu: boolean("lu").default(false).notNull(),
  luAt: timestamp("luAt"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = typeof adminNotifications.$inferInsert;

/**
 * Catalogue de services partagés — modèles de prestations diffusés par l'admin
 * Les studios peuvent importer ces modèles dans leur catalogue
 */
export const sharedServices = mysqlTable("shared_services", {
  id: int("id").autoincrement().primaryKey(),
  nom: varchar("nom", { length: 200 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["piercing", "tatouage", "dermographie"]).notNull(),
  zone: varchar("zone", { length: 200 }),
  prixConseille: int("prixConseille"), // en centimes
  dureeMinutes: int("dureeMinutes"),
  actif: boolean("actif").default(true).notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SharedService = typeof sharedServices.$inferSelect;
export type InsertSharedService = typeof sharedServices.$inferInsert;

/**
 * Table des documents salariés (RGPD Art. 29, engagement confidentialité)
 */
export const documentsSalaries = mysqlTable("documents_salaries", {
  id: varchar("id", { length: 36 }).primaryKey(),
  studioUserId: int("studioUserId").notNull(),
  ownerId: int("ownerId").notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  titre: varchar("titre", { length: 300 }).notNull(),
  contenu: text("contenu"),
  status: mysqlEnum("status", ["draft", "signe"]).default("draft").notNull(),
  signatureSalarie: text("signatureSalarie"),
  dateSigne: varchar("dateSigne", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DocumentSalarie = typeof documentsSalaries.$inferSelect;
export type InsertDocumentSalarie = typeof documentsSalaries.$inferInsert;

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  studioUserId: int("studioUserId"),
  action: varchar("action", { length: 100 }).notNull(),
  ip: varchar("ip", { length: 45 }),
  userAgent: varchar("userAgent", { length: 500 }),
  success: boolean("success").default(true).notNull(),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AuditLog = typeof auditLogs.$inferSelect;

// Patch: champs multi-studio ajoutés
