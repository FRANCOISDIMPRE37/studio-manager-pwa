import { TRPCError } from "@trpc/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import { getDb } from "../db";
import { studioUsers } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";

const S = 12;
const p4 = z.string().length(4).regex(/^\d{4}$/);

// Helper pour les champs optionnels qui peuvent être des chaînes vides
const optionalString = z.string().optional().transform(v => v === "" ? undefined : v);

export const studioUsersRouter = router({
  listForPin: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select({
      id: studioUsers.id,
      prenom: studioUsers.prenom,
      nom: studioUsers.nom,
      role: studioUsers.role,
      hasPinSet: studioUsers.pinHash
    }).from(studioUsers).where(and(eq(studioUsers.ownerId, ctx.user.id), eq(studioUsers.actif, true))).then(r => r.map(x => ({ ...x, hasPinSet: !!x.hasPinSet })));
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
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
      adresse: studioUsers.adresse
    }).from(studioUsers).where(eq(studioUsers.ownerId, ctx.user.id)).then(r => r.map(x => ({ ...x, hasPinSet: !!x.hasPinSet })));
  }),

  create: protectedProcedure.input(z.object({
    prenom: z.string().min(1),
    nom: z.string().min(1),
    login: z.string().min(3),
    password: z.string().min(6),
    pin: p4.optional(),
    role: z.enum(["admin", "employe", "stagiaire"]).default("employe"),
    specialite: optionalString,
    typeContrat: optionalString,
    dateEntree: optionalString,
    dateSortie: optionalString,
    adresse: optionalString
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB");
    const ph = await bcrypt.hash(input.password, S);
    const pinHash = input.pin ? await bcrypt.hash(input.pin, S) : undefined;
    const [result] = await db.insert(studioUsers).values({
      ownerId: ctx.user.id,
      prenom: input.prenom,
      nom: input.nom,
      login: input.login,
      passwordHash: ph,
      pinHash: pinHash ?? null,
      role: input.role,
      actif: true,
      specialite: input.specialite ?? null,
      typeContrat: input.typeContrat ?? null,
      dateEntree: input.dateEntree ?? null,
      dateSortie: input.dateSortie || null,
      adresse: input.adresse ?? null
    });
    return { success: true, id: String(result.insertId) };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    prenom: z.string().min(1).optional(),
    nom: z.string().min(1).optional(),
    pin: p4.optional(),
    role: z.enum(["admin", "employe", "stagiaire"]).optional(),
    actif: z.boolean().optional(),
    specialite: optionalString,
    typeContrat: optionalString,
    dateEntree: optionalString,
    dateSortie: optionalString,
    adresse: optionalString
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB");
    const { id, pin, ...f } = input;
    const data: any = { ...f, updatedAt: new Date() };
    if (pin) data.pinHash = await bcrypt.hash(pin, S);
    
    // Nettoyage des valeurs undefined pour Drizzle
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
    
    await db.update(studioUsers).set(data).where(and(eq(studioUsers.id, id), eq(studioUsers.ownerId, ctx.user.id)));
    return { success: true };
  }),

  setPin: protectedProcedure.input(z.object({ employeId: z.number(), pin: p4 })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB");
    const emp = await db.select().from(studioUsers).where(and(eq(studioUsers.id, input.employeId), eq(studioUsers.ownerId, ctx.user.id))).limit(1);
    if (!emp[0]) throw new TRPCError({ code: "NOT_FOUND" });
    await db.update(studioUsers).set({ pinHash: await bcrypt.hash(input.pin, S), updatedAt: new Date() }).where(eq(studioUsers.id, input.employeId));
    return { success: true };
  }),

  clearPin: protectedProcedure.input(z.object({ employeId: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB");
    await db.update(studioUsers).set({ pinHash: null, updatedAt: new Date() }).where(eq(studioUsers.id, input.employeId));
    return { success: true };
  }),

  loginWithPin: protectedProcedure.input(z.object({ employeId: z.number(), pin: p4 })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB");
    const emp = await db.select().from(studioUsers).where(and(eq(studioUsers.id, input.employeId), eq(studioUsers.ownerId, ctx.user.id), eq(studioUsers.actif, true))).limit(1);
    if (!emp[0]) throw new TRPCError({ code: "UNAUTHORIZED", message: "Employe introuvable ou inactif" });
    if (!emp[0].pinHash) throw new TRPCError({ code: "UNAUTHORIZED", message: "Aucun PIN configure" });
    if (!await bcrypt.compare(input.pin, emp[0].pinHash)) throw new TRPCError({ code: "UNAUTHORIZED", message: "PIN incorrect" });
    return { success: true, employe: { id: emp[0].id, prenom: emp[0].prenom, nom: emp[0].nom, role: emp[0].role } };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB");
    await db.update(studioUsers).set({ actif: false, updatedAt: new Date() }).where(eq(studioUsers.id, input.id));
    return { success: true };
  }),
});
