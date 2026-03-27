import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import {
  getClientsByUserId, getClientById, createClient, updateClientById, deleteClientById,
  getPrestationsByClientId, getPrestationsByUserId, createPrestation, deletePrestationById,
  getDocumentsByClientId, getDocumentsByUserId, getDocumentById, createDocument, updateDocumentById,
  getRDVByUserId, createRDV, updateRDVById, deleteRDVById,
  getSalonSettings, upsertSalonSettings,
  getSmtpConfig, upsertSmtpConfig,
  getStudioUsersByOwner, getStudioUserById, loginExistsForOwner,
  createStudioUser, updateStudioUser, deleteStudioUser,
  getSmsConfig, upsertSmsConfig,
  getUserByOpenId, upsertUser,
  getUserByEmail, createUserWithEmail, getPasswordHashByEmail,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    // Connexion par PIN — crée un cookie de session JWT sans passer par Manus OAuth
    pinLogin: publicProcedure
      .input(z.object({ pin: z.string().length(4) }))
      .mutation(async ({ ctx, input }) => {
        // Récupérer l'utilisateur propriétaire (openId = OWNER_OPEN_ID)
        const ownerOpenId = ENV.ownerOpenId;
        if (!ownerOpenId) throw new Error("Owner not configured");
        let user = await getUserByOpenId(ownerOpenId);
        if (!user) {
          // Créer l'utilisateur owner s'il n'existe pas encore
          await upsertUser({ openId: ownerOpenId, name: "Admin", role: "admin" });
          user = await getUserByOpenId(ownerOpenId);
        }
        if (!user) throw new Error("Failed to get or create owner user");
        // Vérifier le PIN haché stocké dans salon_settings
        const salonSettings = await getSalonSettings(user.id);
        if (!salonSettings?.pinHash) {
          // Pas encore de PIN configuré — autoriser la connexion initiale
          // (le PIN sera configuré lors de l'onboarding)
          const token = await sdk.createSessionToken(ownerOpenId, { name: user.name || "Admin" });
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
          return { success: true, firstLogin: true };
        }
        const pinValid = await bcrypt.compare(input.pin, salonSettings.pinHash);
        if (!pinValid) throw new Error("PIN incorrect");
        const token = await sdk.createSessionToken(ownerOpenId, { name: user.name || "Admin" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
        return { success: true, firstLogin: false };
      }),
    // Enregistrer le PIN haché en base de données
    pinSetup: publicProcedure
      .input(z.object({ pin: z.string().length(4) }))
      .mutation(async ({ ctx, input }) => {
        const ownerOpenId = ENV.ownerOpenId;
        if (!ownerOpenId) throw new Error("Owner not configured");
        let user = await getUserByOpenId(ownerOpenId);
        if (!user) {
          await upsertUser({ openId: ownerOpenId, name: "Admin", role: "admin" });
          user = await getUserByOpenId(ownerOpenId);
        }
        if (!user) throw new Error("Failed to get or create owner user");
        const pinHash = await bcrypt.hash(input.pin, 10);
        await upsertSalonSettings(user.id, { nom: "Mon Studio", pinHash });
        // Créer la session après setup du PIN
        const token = await sdk.createSessionToken(ownerOpenId, { name: user.name || "Admin" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
        return { success: true };
      }),
    // Inscription par email/mot de passe (nouveau studio client)
    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(8),
        nomSalon: z.string().min(2),
      }))
      .mutation(async ({ ctx, input }) => {
        // Vérifier si l'email est déjà utilisé
        const existing = await getUserByEmail(input.email);
        if (existing) throw new Error("Cet email est déjà utilisé");
        // Hasher le mot de passe
        const passwordHash = await bcrypt.hash(input.password, 10);
        // Créer l'utilisateur et le salon
        const user = await createUserWithEmail({
          email: input.email,
          passwordHash,
          name: input.nomSalon,
        });
        // Créer la session
        const token = await sdk.createSessionToken(`email:${input.email}`, { name: input.nomSalon });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
        return { success: true, userId: user.id };
      }),
    // Connexion par email/mot de passe
    loginEmail: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByEmail(input.email);
        if (!user) throw new Error("Email ou mot de passe incorrect");
        const passwordHash = await getPasswordHashByEmail(input.email);
        if (!passwordHash) throw new Error("Email ou mot de passe incorrect");
        const valid = await bcrypt.compare(input.password, passwordHash);
        if (!valid) throw new Error("Email ou mot de passe incorrect");
        const token = await sdk.createSessionToken(`email:${input.email}`, { name: user.name || input.email });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
        return { success: true, userId: user.id };
      }),
    // Mettre à jour le PIN (nécessite d'être authentifié)
    pinUpdate: protectedProcedure
      .input(z.object({ pin: z.string().length(4) }))
      .mutation(async ({ ctx, input }) => {
        const pinHash = await bcrypt.hash(input.pin, 10);
        await upsertSalonSettings(ctx.user.id, { nom: "Mon Studio", pinHash });
        return { success: true };
      }),
  }),

  clients: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getClientsByUserId(ctx.user.id);
    }),
    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        return getClientById(input.id, ctx.user.id);
      }),
    create: protectedProcedure
      .input(z.object({
        id: z.string(),
        nom: z.string(),
        prenom: z.string(),
        dateNaissance: z.string(),
        adresse: z.string().optional(),
        codePostal: z.string().optional(),
        ville: z.string().optional(),
        telephone: z.string(),
        email: z.string().optional(),
        pieceIdentiteType: z.enum(["CNI", "Passeport", "Permis", "Autre"]).optional(),
        pieceIdentiteNumero: z.string().optional(),
        estMineur: z.boolean().default(false),
        estArchive: z.boolean().default(false),
        dateArchivage: z.string().optional(),
        dateConsentement: z.string().optional(),
        dateSuppressionPrevue: z.string(),
        rgpdDroitsExerces: z.array(z.object({
          type: z.string(), date: z.string(), note: z.string().optional(),
        })).default([]),
      }))
      .mutation(async ({ ctx, input }) => {
        return createClient({ ...input, userId: ctx.user.id });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        nom: z.string().optional(),
        prenom: z.string().optional(),
        dateNaissance: z.string().optional(),
        adresse: z.string().optional(),
        codePostal: z.string().optional(),
        ville: z.string().optional(),
        telephone: z.string().optional(),
        email: z.string().optional(),
        pieceIdentiteType: z.enum(["CNI", "Passeport", "Permis", "Autre"]).optional(),
        pieceIdentiteNumero: z.string().optional(),
        estMineur: z.boolean().optional(),
        estArchive: z.boolean().optional(),
        dateArchivage: z.string().optional(),
        dateConsentement: z.string().optional(),
        dateSuppressionPrevue: z.string().optional(),
        rgpdDroitsExerces: z.array(z.object({
          type: z.string(), date: z.string(), note: z.string().optional(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateClientById(id, ctx.user.id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await deleteClientById(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  prestations: router({
    listAll: protectedProcedure.query(async ({ ctx }) => {
      return getPrestationsByUserId(ctx.user.id);
    }),
    listByClient: protectedProcedure
      .input(z.object({ clientId: z.string() }))
      .query(async ({ ctx, input }) => {
        return getPrestationsByClientId(input.clientId, ctx.user.id);
      }),
    create: protectedProcedure
      .input(z.object({
        id: z.string(),
        clientId: z.string(),
        date: z.string(),
        type: z.enum(["piercing", "tatouage", "dermographie"]),
        zone: z.string(),
        description: z.string().optional(),
        photos: z.array(z.string()).default([]),
      }))
      .mutation(async ({ ctx, input }) => {
        return createPrestation({ ...input, userId: ctx.user.id });
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await deletePrestationById(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  documents: router({
    listAll: protectedProcedure.query(async ({ ctx }) => {
      return getDocumentsByUserId(ctx.user.id);
    }),
    listByClient: protectedProcedure
      .input(z.object({ clientId: z.string() }))
      .query(async ({ ctx, input }) => {
        return getDocumentsByClientId(input.clientId, ctx.user.id);
      }),
    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        return getDocumentById(input.id, ctx.user.id);
      }),
    create: protectedProcedure
      .input(z.object({
        id: z.string(),
        clientId: z.string(),
        type: z.string(),
        status: z.enum(["empty", "filled", "signed"]).default("empty"),
        data: z.record(z.string(), z.unknown()).default({}),
        signatureClient: z.string().optional(),
        signatureProfessionnel: z.string().optional(),
        signatureRepresentant: z.string().optional(),
        dateSigned: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createDocument({ ...input, userId: ctx.user.id });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        status: z.enum(["empty", "filled", "signed"]).optional(),
        data: z.record(z.string(), z.unknown()).optional(),
        signatureClient: z.string().optional(),
        signatureProfessionnel: z.string().optional(),
        signatureRepresentant: z.string().optional(),
        dateSigned: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateDocumentById(id, ctx.user.id, data);
        return { success: true };
      }),
  }),

  rdv: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getRDVByUserId(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        id: z.string(),
        clientId: z.string().optional(),
        clientNom: z.string().optional(),
        clientTelephone: z.string().optional(),
        date: z.string(),
        heureDebut: z.string(),
        heureFin: z.string(),
        type: z.enum(["piercing", "tatouage", "dermographie", "consultation", "retouche", "autre"]),
        zone: z.string().optional(),
        notes: z.string().optional(),
        statut: z.enum(["confirme", "en_attente", "annule", "termine"]).default("confirme"),
      }))
      .mutation(async ({ ctx, input }) => {
        return createRDV({ ...input, userId: ctx.user.id });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        clientId: z.string().optional(),
        clientNom: z.string().optional(),
        clientTelephone: z.string().optional(),
        date: z.string().optional(),
        heureDebut: z.string().optional(),
        heureFin: z.string().optional(),
        type: z.enum(["piercing", "tatouage", "dermographie", "consultation", "retouche", "autre"]).optional(),
        zone: z.string().optional(),
        notes: z.string().optional(),
        statut: z.enum(["confirme", "en_attente", "annule", "termine"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateRDVById(id, ctx.user.id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await deleteRDVById(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  salon: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getSalonSettings(ctx.user.id);
    }),
    update: protectedProcedure
      .input(z.object({
        nom: z.string().optional(),
        raisonSociale: z.string().optional(),
        adresse: z.string().optional(),
        codePostal: z.string().optional(),
        ville: z.string().optional(),
        telephone: z.string().optional(),
        email: z.string().optional(),
        siret: z.string().optional(),
        nomPierceur: z.string().optional(),
        nomTatoueur: z.string().optional(),
        nomDermographe: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertSalonSettings(ctx.user.id, input);
        return { success: true };
      }),
  }),

  smtp: router({
    // Récupérer la config SMTP (mot de passe masqué)
    get: protectedProcedure.query(async ({ ctx }) => {
      const config = await getSmtpConfig(ctx.user.id);
      if (!config) return null;
      return {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.user,
        passwordSet: config.password.length > 0,
        fromName: config.fromName,
        replyTo: config.replyTo,
      };
    }),
    // Sauvegarder la config SMTP
    save: protectedProcedure
      .input(z.object({
        host: z.string().min(1),
        port: z.number().int().min(1).max(65535),
        secure: z.boolean(),
        user: z.string().min(1),
        password: z.string().optional(), // vide = ne pas changer
        fromName: z.string().optional(),
        replyTo: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getSmtpConfig(ctx.user.id);
        const password = input.password && input.password.length > 0
          ? input.password
          : (existing?.password ?? '');
        await upsertSmtpConfig(ctx.user.id, {
          host: input.host,
          port: input.port,
          secure: input.secure,
          user: input.user,
          password,
          fromName: input.fromName ?? null,
          replyTo: input.replyTo ?? null,
        });
        return { success: true };
      }),
    // Tester la connexion SMTP
    test: protectedProcedure.mutation(async ({ ctx }) => {
      const config = await getSmtpConfig(ctx.user.id);
      if (!config || !config.user || !config.password) {
        throw new Error('Configuration SMTP incomplète. Veuillez d\'abord sauvegarder vos paramètres.');
      }
      try {
        const transporter = nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.secure,
          auth: { user: config.user, pass: config.password },
          tls: { rejectUnauthorized: false },
        });
        await transporter.verify();
        return { success: true, message: 'Connexion SMTP réussie !' };
      } catch (err: any) {
        throw new Error(`Échec de connexion SMTP : ${err.message}`);
      }
    }),
    // Envoyer un email avec le contenu d'une fiche
    sendDocument: protectedProcedure
      .input(z.object({
        to: z.string().email(),
        subject: z.string(),
        body: z.string(),
        documentTitle: z.string(),
        clientNom: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const config = await getSmtpConfig(ctx.user.id);
        if (!config || !config.user || !config.password) {
          throw new Error('Configuration SMTP non configurée. Rendez-vous dans Paramètres > Configuration Email.');
        }
        const salon = await getSalonSettings(ctx.user.id);
        const fromName = config.fromName || salon?.nom || 'Studio Manager';
        try {
          const transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: { user: config.user, pass: config.password },
            tls: { rejectUnauthorized: false },
          });
          await transporter.sendMail({
            from: `"${fromName}" <${config.user}>`,
            to: input.to,
            replyTo: config.replyTo || config.user,
            subject: input.subject,
            html: `<div style="font-family:sans-serif;max-width:600px;margin:auto">
              <h2 style="color:#0A1628">${input.documentTitle}</h2>
              <p>Bonjour ${input.clientNom},</p>
              ${input.body}
              <hr style="margin:24px 0;border:none;border-top:1px solid #eee">
              <p style="font-size:12px;color:#888">${fromName} — ${salon?.adresse || ''} ${salon?.ville || ''}</p>
            </div>`,
          });
          return { success: true };
        } catch (err: any) {
          throw new Error(`Échec d'envoi : ${err.message}`);
        }
      }),

    // Envoyer le dossier complet d'un client
    sendClientDossier: protectedProcedure
      .input(z.object({
        to: z.string().email(),
        clientId: z.string(),
        clientNom: z.string(),
        clientPrenom: z.string(),
        clientDateNaissance: z.string().optional(),
        clientTelephone: z.string().optional(),
        documents: z.array(z.object({
          id: z.string(),
          type: z.string(),
          label: z.string(),
          signed: z.boolean(),
          updatedAt: z.string().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const config = await getSmtpConfig(ctx.user.id);
        if (!config || !config.user || !config.password) {
          throw new Error('Configuration SMTP non configurée. Rendez-vous dans Paramètres > Configuration Email.');
        }
        const salon = await getSalonSettings(ctx.user.id);
        const fromName = config.fromName || salon?.nom || 'Studio Manager';
        const salonInfo = salon ? `${salon.nom || ''} — ${salon.adresse || ''} ${salon.codePostal || ''} ${salon.ville || ''}`.trim() : 'Studio Manager';
        const dateEnvoi = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

        const signedDocs = input.documents.filter(d => d.signed);
        const unsignedDocs = input.documents.filter(d => !d.signed);

        const docRow = (doc: typeof input.documents[0]) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0">${doc.label}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center">
              ${doc.signed
                ? '<span style="color:#16a34a;font-weight:600">&#10003; Signé</span>'
                : '<span style="color:#dc2626;font-weight:600">&#10007; Non signé</span>'}
            </td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#888;font-size:12px">
              ${doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString('fr-FR') : '—'}
            </td>
          </tr>`;

        const html = `
          <div style="font-family:sans-serif;max-width:680px;margin:auto;color:#1a1a2e">
            <!-- En-tête -->
            <div style="background:#0A1628;padding:24px 32px;border-radius:12px 12px 0 0">
              <h1 style="color:#83D0F5;margin:0;font-size:20px">Studio Manager</h1>
              <p style="color:#a0aec0;margin:4px 0 0;font-size:13px">by Intemporelle — RGPD &amp; Cybersécurité</p>
            </div>

            <!-- Corps -->
            <div style="background:#ffffff;padding:32px;border:1px solid #e2e8f0">
              <h2 style="color:#0A1628;font-size:18px;margin-top:0">Dossier complet du client</h2>

              <!-- Infos client -->
              <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#f8fafc;border-radius:8px">
                <tr><td style="padding:8px 16px;font-size:13px;color:#64748b;width:40%">Nom complet</td><td style="padding:8px 16px;font-weight:600">${input.clientPrenom} ${input.clientNom}</td></tr>
                ${input.clientDateNaissance ? `<tr><td style="padding:8px 16px;font-size:13px;color:#64748b">Date de naissance</td><td style="padding:8px 16px">${input.clientDateNaissance}</td></tr>` : ''}
                ${input.clientTelephone ? `<tr><td style="padding:8px 16px;font-size:13px;color:#64748b">Téléphone</td><td style="padding:8px 16px">${input.clientTelephone}</td></tr>` : ''}
                <tr><td style="padding:8px 16px;font-size:13px;color:#64748b">Date d'envoi</td><td style="padding:8px 16px">${dateEnvoi}</td></tr>
                <tr><td style="padding:8px 16px;font-size:13px;color:#64748b">Nombre de documents</td><td style="padding:8px 16px">${input.documents.length} (${signedDocs.length} signé${signedDocs.length > 1 ? 's' : ''})</td></tr>
              </table>

              <!-- Tableau des documents -->
              <h3 style="color:#0A1628;font-size:15px;margin-bottom:12px">Documents du dossier</h3>
              <table style="width:100%;border-collapse:collapse;font-size:13px">
                <thead>
                  <tr style="background:#0A1628;color:#83D0F5">
                    <th style="padding:10px 12px;text-align:left;font-weight:600">Document</th>
                    <th style="padding:10px 12px;text-align:center;font-weight:600">Statut</th>
                    <th style="padding:10px 12px;text-align:left;font-weight:600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${input.documents.map(docRow).join('')}
                </tbody>
              </table>

              ${unsignedDocs.length > 0 ? `
              <div style="margin-top:20px;padding:12px 16px;background:#fef2f2;border-left:4px solid #dc2626;border-radius:4px">
                <p style="margin:0;font-size:13px;color:#dc2626">
                  <strong>Attention :</strong> ${unsignedDocs.length} document${unsignedDocs.length > 1 ? 's' : ''} n'${unsignedDocs.length > 1 ? 'ont' : 'a'} pas encore été signé${unsignedDocs.length > 1 ? 's' : ''} par le client.
                </p>
              </div>` : `
              <div style="margin-top:20px;padding:12px 16px;background:#f0fdf4;border-left:4px solid #16a34a;border-radius:4px">
                <p style="margin:0;font-size:13px;color:#16a34a">
                  <strong>Dossier complet :</strong> Tous les documents ont été signés par le client.
                </p>
              </div>`}
            </div>

            <!-- Pied de page -->
            <div style="background:#f8fafc;padding:16px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
              <p style="margin:0;font-size:12px;color:#94a3b8">${salonInfo}</p>
              <p style="margin:4px 0 0;font-size:11px;color:#cbd5e1">Document généré par Studio Manager by Intemporelle — Conforme RGPD</p>
            </div>
          </div>`;

        try {
          const transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: { user: config.user, pass: config.password },
            tls: { rejectUnauthorized: false },
          });
          await transporter.sendMail({
            from: `"${fromName}" <${config.user}>`,
            to: input.to,
            replyTo: config.replyTo || config.user,
            subject: `Dossier client — ${input.clientPrenom} ${input.clientNom} — ${dateEnvoi}`,
            html,
          });
          return { success: true };
        } catch (err: any) {
          throw new Error(`Échec d'envoi : ${err.message}`);
        }
      }),

    // ─── Alertes RGPD : clients à supprimer dans <= 30 jours ───
    getRgpdAlerts: protectedProcedure.query(async ({ ctx }) => {
      const clients = await getClientsByUserId(ctx.user.id);
      const now = Date.now();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      return clients
        .filter(c => !c.estArchive)
        .map(c => {
          const suppDate = new Date(c.dateSuppressionPrevue).getTime();
          const diffDays = Math.floor((suppDate - now) / (1000 * 60 * 60 * 24));
          return { ...c, diffDays };
        })
        .filter(c => c.diffDays <= 30)
        .sort((a, b) => a.diffDays - b.diffDays);
    }),

    sendRgpdAlert: protectedProcedure
      .input(z.object({
        clientId: z.string(),
        clientNom: z.string(),
        clientPrenom: z.string(),
        clientEmail: z.string().email(),
        dateSuppressionPrevue: z.string(),
        diffDays: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const config = await getSmtpConfig(ctx.user.id);
        if (!config) throw new Error('Configuration SMTP non configurée. Rendez-vous dans Paramètres → Configuration Email.');
        const salonSettings = await getSalonSettings(ctx.user.id);
        const salonNom = salonSettings?.nom || 'Studio Manager';
        const fromName = salonSettings?.nom || 'Studio Manager by Intemporelle';
        const dateSupp = new Date(input.dateSuppressionPrevue).toLocaleDateString('fr-FR');
        const urgencyColor = input.diffDays <= 7 ? '#dc2626' : input.diffDays <= 14 ? '#ea580c' : '#d97706';
        const urgencyLabel = input.diffDays <= 0 ? 'IMMÉDIATE' : input.diffDays <= 7 ? 'URGENTE (moins de 7 jours)' : input.diffDays <= 14 ? 'Sous 14 jours' : 'Sous 30 jours';

        const html = `
          <div style="font-family:sans-serif;max-width:640px;margin:auto;color:#1a1a2e">
            <div style="background:#0A1628;padding:24px 32px;border-radius:12px 12px 0 0">
              <h1 style="color:#83D0F5;margin:0;font-size:20px">${salonNom}</h1>
              <p style="color:#a0aec0;margin:4px 0 0;font-size:13px">Notification RGPD — Gestion de vos données personnelles</p>
            </div>
            <div style="background:#ffffff;padding:32px;border:1px solid #e2e8f0">
              <p style="font-size:16px;margin-top:0">Bonjour <strong>${input.clientPrenom} ${input.clientNom}</strong>,</p>
              <p style="font-size:14px;line-height:1.6;color:#374151">
                Conformément au Règlement Général sur la Protection des Données (RGPD — UE 2016/679),
                nous vous informons que vos données personnelles conservées dans notre système
                seront <strong>supprimées le ${dateSupp}</strong>.
              </p>
              <div style="margin:24px 0;padding:16px 20px;background:${urgencyColor}11;border-left:4px solid ${urgencyColor};border-radius:4px">
                <p style="margin:0;font-size:14px;color:${urgencyColor}">
                  <strong>⚠ Suppression ${urgencyLabel}</strong>
                  ${input.diffDays > 0 ? ` — dans <strong>${input.diffDays} jour${input.diffDays > 1 ? 's' : ''}</strong>` : ' — date dépassée'}
                </p>
              </div>
              <p style="font-size:13px;color:#6b7280;line-height:1.6">
                Si vous souhaitez continuer à bénéficier de nos services et conserver votre dossier,
                veuillez nous contacter avant cette date pour renouveler votre consentement.
              </p>
              <p style="font-size:13px;color:#6b7280;line-height:1.6">
                Conformément aux articles 15, 17 et 21 du RGPD, vous disposez d'un droit d'accès,
                de rectification, d'effacement et d'opposition sur vos données.
              </p>
            </div>
            <div style="background:#f8fafc;padding:16px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
              <p style="margin:0;font-size:12px;color:#94a3b8">${salonNom} — Notification automatique RGPD</p>
              <p style="margin:4px 0 0;font-size:11px;color:#cbd5e1">Généré par Studio Manager by Intemporelle</p>
            </div>
          </div>`;

        try {
          const transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: { user: config.user, pass: config.password },
            tls: { rejectUnauthorized: false },
          });
          await transporter.sendMail({
            from: `"${fromName}" <${config.user}>`,
            to: input.clientEmail,
            subject: `[RGPD] Suppression de vos données prévue le ${dateSupp} — ${salonNom}`,
            html,
          });
          return { success: true };
        } catch (err: any) {
          throw new Error(`Échec d'envoi : ${err.message}`);
        }
      }),
  }),

  // ─── Configuration et envoi SMS via Brevo ────────────────────────────────
  sms: router({
    // Récupérer la config SMS (clé API masquée)
    getConfig: protectedProcedure.query(async ({ ctx }) => {
      const config = await getSmsConfig(ctx.user.id);
      if (!config) return null;
      return {
        apiKeySet: config.apiKey.length > 0,
        apiKeyPreview: config.apiKey.length > 8 ? `${config.apiKey.slice(0, 4)}...${config.apiKey.slice(-4)}` : '****',
        senderName: config.senderName,
      };
    }),

    // Sauvegarder la config SMS
    saveConfig: protectedProcedure
      .input(z.object({
        apiKey: z.string().min(10, 'Clé API invalide'),
        senderName: z.string().min(1).max(11, 'Max 11 caractères').regex(/^[a-zA-Z0-9]+$/, 'Lettres et chiffres uniquement'),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertSmsConfig(ctx.user.id, { apiKey: input.apiKey, senderName: input.senderName });
        return { success: true };
      }),

    // Envoyer un SMS via l'API Brevo
    send: protectedProcedure
      .input(z.object({
        to: z.string().min(10, 'Numéro invalide'), // ex: +33612345678
        message: z.string().min(1).max(160, 'SMS limité à 160 caractères'),
        clientNom: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const config = await getSmsConfig(ctx.user.id);
        if (!config || !config.apiKey) {
          throw new Error('Configuration SMS non configurée. Rendez-vous dans Paramètres > Configuration SMS.');
        }
        // Nettoyer le numéro : supprimer espaces et tirets, ajouter +33 si numéro FR
        let phone = input.to.replace(/[\s\-\.]/g, '');
        if (phone.startsWith('0') && phone.length === 10) {
          phone = '+33' + phone.slice(1);
        }
        const salon = await getSalonSettings(ctx.user.id);
        const sender = config.senderName || salon?.nom?.slice(0, 11) || 'Studio';
        try {
          const response = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'api-key': config.apiKey,
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              sender: sender.slice(0, 11),
              recipient: phone,
              content: input.message,
              type: 'transactional',
            }),
          });
          if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error((err as any).message || `Erreur Brevo : ${response.status}`);
          }
          return { success: true, phone };
        } catch (err: any) {
          throw new Error(`Échec d'envoi SMS : ${err.message}`);
        }
      }),

    // Envoyer un SMS de rappel de RDV
    sendRappelRdv: protectedProcedure
      .input(z.object({
        clientNom: z.string(),
        clientPrenom: z.string(),
        telephone: z.string(),
        rdvDate: z.string(),
        rdvHeure: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const config = await getSmsConfig(ctx.user.id);
        if (!config || !config.apiKey) {
          throw new Error('Configuration SMS non configurée.');
        }
        const salon = await getSalonSettings(ctx.user.id);
        const salonNom = salon?.nom || 'votre studio';
        const message = `Bonjour ${input.clientPrenom}, rappel de votre RDV le ${input.rdvDate} à ${input.rdvHeure} chez ${salonNom}. À bientôt !`;
        let phone = input.telephone.replace(/[\s\-\.]/g, '');
        if (phone.startsWith('0') && phone.length === 10) phone = '+33' + phone.slice(1);
        const sender = (config.senderName || salonNom).slice(0, 11);
        const response = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
          method: 'POST',
          headers: { 'accept': 'application/json', 'api-key': config.apiKey, 'content-type': 'application/json' },
          body: JSON.stringify({ sender, recipient: phone, content: message, type: 'transactional' }),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error((err as any).message || `Erreur Brevo : ${response.status}`);
        }
        return { success: true, message };
      }),
  }),

  // ─── Gestion des utilisateurs locaux du studio ───────────────────────────
  studioUsers: router({
    // Lister tous les utilisateurs du studio
    list: protectedProcedure.query(async ({ ctx }) => {
      return getStudioUsersByOwner(ctx.user.id);
    }),

    // Créer un nouvel utilisateur
    create: protectedProcedure
      .input(z.object({
        prenom: z.string().min(1, 'Le prénom est requis'),
        nom: z.string().min(1, 'Le nom est requis'),
        login: z.string().min(3, 'Le login doit faire au moins 3 caractères').regex(/^[a-zA-Z0-9._-]+$/, 'Login invalide (lettres, chiffres, . _ - uniquement)'),
        password: z.string().min(6, 'Le mot de passe doit faire au moins 6 caractères'),
        role: z.enum(['admin', 'employe', 'stagiaire']).default('employe'),
        actif: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const exists = await loginExistsForOwner(input.login, ctx.user.id);
        if (exists) throw new Error(`Le login "${input.login}" est déjà utilisé.`);
        const passwordHash = await bcrypt.hash(input.password, 10);
        await createStudioUser({
          ownerId: ctx.user.id,
          prenom: input.prenom,
          nom: input.nom,
          login: input.login,
          passwordHash,
          role: input.role,
          actif: input.actif,
        });
        return { success: true };
      }),

    // Modifier un utilisateur existant
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        prenom: z.string().min(1).optional(),
        nom: z.string().min(1).optional(),
        login: z.string().min(3).regex(/^[a-zA-Z0-9._-]+$/).optional(),
        password: z.string().min(6).optional(), // vide = ne pas changer
        role: z.enum(['admin', 'employe', 'stagiaire']).optional(),
        actif: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, password, ...rest } = input;
        if (rest.login) {
          const exists = await loginExistsForOwner(rest.login, ctx.user.id, id);
          if (exists) throw new Error(`Le login "${rest.login}" est déjà utilisé.`);
        }
        const updateData: Record<string, unknown> = { ...rest };
        if (password && password.length > 0) {
          updateData.passwordHash = await bcrypt.hash(password, 10);
        }
        await updateStudioUser(id, ctx.user.id, updateData as any);
        return { success: true };
      }),

    // Supprimer un utilisateur
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteStudioUser(input.id, ctx.user.id);
        return { success: true };
      }),

    // Réinitialiser le mot de passe
    resetPassword: protectedProcedure
      .input(z.object({ id: z.number(), newPassword: z.string().min(6) }))
      .mutation(async ({ ctx, input }) => {
        const passwordHash = await bcrypt.hash(input.newPassword, 10);
        await updateStudioUser(input.id, ctx.user.id, { passwordHash });
        return { success: true };
      }),
  }),

  admin: router({
    // Lister tous les studios inscrits (admin uniquement)
    listStudios: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new Error('Accès refusé');
      const db = await import('./db').then(m => m.getDb());
      if (!db) return [];
      const { users } = await import('../drizzle/schema');
      const result = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        loginMethod: users.loginMethod,
        role: users.role,
        createdAt: users.createdAt,
      }).from(users).orderBy(users.createdAt);
      return result;
    }),
  }),
  rappels: router({
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const db = await import('./db').then(m => m.getDb());
      if (!db) return { rappels: [], total: 0 };
      try {
        const result = await (db as any).$client.query(
          'SELECT * FROM rdv_rappels WHERE userId = ? ORDER BY createdAt DESC LIMIT 50',
          [ctx.user.id]
        );
        const rows = Array.isArray(result) ? result[0] : [];
        return { rappels: rows as any[], total: (rows as any[]).length };
      } catch { return { rappels: [], total: 0 }; }
    }),
  }),
});

export type AppRouter = typeof appRouter;
