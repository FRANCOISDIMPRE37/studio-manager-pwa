import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { studios, subscriptions, invitations } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import crypto from "crypto";

// Plans disponibles
export const PLANS = {
  trial: { name: "Essai gratuit", price: 0, maxClients: 50, maxUsers: 1, durationDays: 30 },
  solo: { name: "Solo", price: 29, maxClients: 500, maxUsers: 1, durationDays: null },
  studio: { name: "Studio", price: 49, maxClients: -1, maxUsers: 3, durationDays: null },
  multi: { name: "Multi-sites", price: 99, maxClients: -1, maxUsers: -1, durationDays: null },
} as const;

export const studioRouter = router({
  // Récupérer le studio de l'utilisateur connecté
  getMy: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const studio = await db
      .select()
      .from(studios)
      .where(eq(studios.userId, ctx.user.id))
      .limit(1);
    return studio[0] ?? null;
  }),

  // Créer ou mettre à jour le studio de l'utilisateur
  upsert: protectedProcedure
    .input(
      z.object({
        nom: z.string().min(1).max(200),
        raisonSociale: z.string().max(200).optional(),
        siret: z.string().max(20).optional(),
        adresse: z.string().optional(),
        codePostal: z.string().max(10).optional(),
        ville: z.string().max(100).optional(),
        telephone: z.string().max(20).optional(),
        email: z.string().email().max(320).optional(),
        logoUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existing = await db
        .select()
        .from(studios)
        .where(eq(studios.userId, ctx.user.id))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(studios)
          .set({ ...input, updatedAt: new Date() })
          .where(eq(studios.userId, ctx.user.id));
        return { success: true, action: "updated" };
      } else {
        const baseSlug = input.nom
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .slice(0, 80);
        const slug = `${baseSlug}-${Date.now().toString(36)}`;

        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 30);

        await db.insert(studios).values({
          userId: ctx.user.id,
          nom: input.nom,
          slug,
          raisonSociale: input.raisonSociale,
          siret: input.siret,
          adresse: input.adresse,
          codePostal: input.codePostal,
          ville: input.ville,
          telephone: input.telephone,
          email: input.email,
          logoUrl: input.logoUrl,
          planType: "trial",
          trialEndsAt,
          actif: true,
        });
        return { success: true, action: "created" };
      }
    }),

  // Vérifier si l'essai est encore valide
  checkAccess: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { hasAccess: true, planType: "trial", daysLeft: 30, message: null };

    const studio = await db
      .select()
      .from(studios)
      .where(eq(studios.userId, ctx.user.id))
      .limit(1);

    if (!studio[0]) {
      return { hasAccess: true, planType: "trial", daysLeft: 30, message: null };
    }

    const s = studio[0];

    if (!s.actif) {
      return { hasAccess: false, planType: s.planType, daysLeft: 0, message: "Votre compte est suspendu. Contactez le support." };
    }

    if (s.planType === "trial" && s.trialEndsAt) {
      const now = new Date();
      const daysLeft = Math.ceil((s.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 0) {
        return { hasAccess: false, planType: "trial", daysLeft: 0, message: "Votre période d'essai est terminée. Choisissez un abonnement pour continuer." };
      }
      return { hasAccess: true, planType: "trial", daysLeft, message: daysLeft <= 7 ? `Il vous reste ${daysLeft} jour(s) d'essai gratuit.` : null };
    }

    // Abonnement actif
    const sub = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, ctx.user.id), eq(subscriptions.status, "active")))
      .limit(1);

    if (sub.length > 0) {
      return { hasAccess: true, planType: s.planType, daysLeft: null, message: null };
    }

    return { hasAccess: true, planType: s.planType, daysLeft: null, message: null };
  }),

  // Récupérer les plans disponibles
  getPlans: publicProcedure.query(() => {
    return Object.entries(PLANS).map(([key, plan]) => ({
      id: key,
      ...plan,
    }));
  }),
});

// Router pour les invitations (super-admin)
export const invitationRouter = router({
  // Créer une invitation (super-admin uniquement)
  create: protectedProcedure
    .input(
      z.object({
        email: z.string().email().optional(),
        planType: z.enum(["trial", "solo", "studio", "multi"]).default("trial"),
        trialDays: z.number().min(1).max(365).default(30),
        expiresInDays: z.number().min(1).max(365).default(90),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const code = crypto.randomBytes(16).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

      await db.insert(invitations).values({
        code,
        email: input.email,
        planType: input.planType,
        trialDays: input.trialDays,
        expiresAt,
        createdByUserId: ctx.user.id,
      });

      return { code, inviteUrl: `${process.env.VITE_OAUTH_PORTAL_URL ?? ""}/register?invite=${code}` };
    }),

  // Lister les invitations (super-admin)
  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const db = await getDb();
    if (!db) return [];
    return db.select().from(invitations).orderBy(invitations.createdAt);
  }),

  // Valider un code d'invitation (public)
  validate: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { valid: false, reason: "Service temporairement indisponible" };

      const inv = await db
        .select()
        .from(invitations)
        .where(eq(invitations.code, input.code))
        .limit(1);

      if (!inv[0]) return { valid: false, reason: "Code invalide" };
      if (inv[0].usedByUserId) return { valid: false, reason: "Ce code a déjà été utilisé" };
      if (inv[0].expiresAt && inv[0].expiresAt < new Date()) return { valid: false, reason: "Ce code a expiré" };

      return {
        valid: true,
        planType: inv[0].planType,
        trialDays: inv[0].trialDays,
        email: inv[0].email,
      };
    }),
});
