/**
 * Système de rappels automatiques par email 24h avant chaque RDV.
 * Ce module est démarré une fois au lancement du serveur.
 * Il s'exécute toutes les heures pour détecter les RDV du lendemain.
 */
import nodemailer from "nodemailer";
import mysql from "mysql2/promise";
import { randomUUID } from "crypto";

function getPool(): mysql.Pool | null {
  if (!process.env.DATABASE_URL) return null;
  try {
    return mysql.createPool(process.env.DATABASE_URL + "?ssl={\"rejectUnauthorized\":false}");
  } catch {
    return null;
  }
}

let pool: mysql.Pool | null = null;

function getDbPool(): mysql.Pool | null {
  if (!pool) pool = getPool();
  return pool;
}

async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const p = getDbPool();
  if (!p) return [];
  try {
    const [rows] = await p.execute(sql, params);
    return rows as T[];
  } catch (err) {
    console.error('[Rappels] SQL error:', err);
    return [];
  }
}

// Récupère tous les users actifs ayant une config SMTP
async function getUsersWithSmtp() {
  return query<{ userId: number; host: string; port: number; secure: boolean; user: string; password: string; fromName: string | null; replyTo: string | null; salonNom: string | null }>(
    `SELECT s.userId, s.host, s.port, s.secure, s.user, s.password, s.fromName, s.replyTo,
            ss.nom as salonNom
     FROM smtp_config s
     LEFT JOIN salon_settings ss ON ss.userId = s.userId
     WHERE s.host IS NOT NULL AND s.user IS NOT NULL AND s.password IS NOT NULL`
  );
}

// Récupère les RDV du lendemain pour un userId donné
async function getRdvDemain(userId: number) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  return query<any>(
    `SELECT * FROM rendez_vous WHERE userId = ? AND date = ? AND statut != 'annule'`,
    [userId, tomorrowStr]
  );
}

// Récupère l'email d'un client
async function getClientEmail(clientId: string | null, userId: number): Promise<string | null> {
  if (!clientId) return null;
  const rows = await query<{ email: string | null }>(
    `SELECT email FROM clients WHERE id = ? AND userId = ? LIMIT 1`,
    [clientId, userId]
  );
  return rows[0]?.email || null;
}

// Vérifie si un rappel a déjà été envoyé
async function rappelExists(userId: number, rdvId: string): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `SELECT id FROM rdv_rappels WHERE userId = ? AND rdvId = ? AND statut = 'envoye' LIMIT 1`,
    [userId, rdvId]
  );
  return rows.length > 0;
}

// Insère un rappel en base
async function insertRappel(r: {
  id: string; userId: number; rdvId: string; rdvDate: string; rdvHeure: string;
  clientNom: string | null; clientEmail: string | null;
  sentAt: number; statut: string; errorMessage: string | null; createdAt: number;
}) {
  const p = getDbPool();
  if (!p) return;
  try {
    await p.execute(
      `INSERT INTO rdv_rappels (id, userId, rdvId, rdvDate, rdvHeure, clientNom, clientEmail, sentAt, statut, errorMessage, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.id, r.userId, r.rdvId, r.rdvDate, r.rdvHeure, r.clientNom, r.clientEmail, r.sentAt, r.statut, r.errorMessage, r.createdAt]
    );
  } catch (err) {
    console.error('[Rappels] Insert error:', err);
  }
}

// Envoie un email de rappel
async function sendRappelEmail(cfg: { host: string; port: number; secure: boolean; user: string; password: string; fromName: string | null; replyTo: string | null }, salonNom: string, rdv: any, clientEmail: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.password },
    tls: { rejectUnauthorized: false },
  });

  const rdvDate = new Date(rdv.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fromName = cfg.fromName || salonNom;
  const typeLabel: Record<string, string> = {
    piercing: 'Piercing', tatouage: 'Tatouage', dermographe: 'Dermographie',
    retouche: 'Retouche', consultation: 'Consultation', autre: 'Rendez-vous',
  };
  const type = typeLabel[rdv.type] || 'Rendez-vous';

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;color:#1a1a2e">
      <div style="background:#0A1628;padding:24px 32px;border-radius:12px 12px 0 0">
        <h1 style="color:#83D0F5;margin:0;font-size:20px">${salonNom}</h1>
        <p style="color:#a0aec0;margin:4px 0 0;font-size:13px">Rappel de rendez-vous</p>
      </div>
      <div style="background:#ffffff;padding:32px;border:1px solid #e2e8f0">
        <p style="font-size:16px;margin-top:0">Bonjour <strong>${rdv.clientNom || 'cher(e) client(e)'}</strong>,</p>
        <p style="font-size:14px;line-height:1.6;color:#374151">
          Nous vous rappelons que vous avez un rendez-vous <strong>${type}</strong> prévu :
        </p>
        <div style="margin:20px 0;padding:20px 24px;background:#f0f9ff;border-left:4px solid #83D0F5;border-radius:4px">
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#6b7280;width:100px">📅 Date</td>
              <td style="padding:4px 0;font-size:14px;color:#1a1a2e;font-weight:600;text-transform:capitalize">${rdvDate}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#6b7280">🕐 Heure</td>
              <td style="padding:4px 0;font-size:14px;color:#1a1a2e;font-weight:600">${rdv.heureDebut} – ${rdv.heureFin}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#6b7280">💉 Type</td>
              <td style="padding:4px 0;font-size:14px;color:#1a1a2e;font-weight:600">${type}${rdv.zone ? ` — ${rdv.zone}` : ''}</td>
            </tr>
          </table>
        </div>
        ${rdv.notes ? `<p style="font-size:13px;color:#6b7280;line-height:1.6"><strong>Notes :</strong> ${rdv.notes}</p>` : ''}
        <p style="font-size:13px;color:#6b7280;line-height:1.6;margin-top:24px">
          En cas d'empêchement, merci de nous contacter le plus tôt possible afin de libérer le créneau.
        </p>
        <p style="font-size:14px;color:#374151;margin-top:16px">À très bientôt,<br><strong>${salonNom}</strong></p>
      </div>
      <div style="background:#f8fafc;padding:16px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
        <p style="margin:0;font-size:12px;color:#94a3b8">${salonNom} — Rappel automatique</p>
        <p style="margin:4px 0 0;font-size:11px;color:#cbd5e1">Généré par Studio Manager by Intemporelle</p>
      </div>
    </div>`;

  await transporter.sendMail({
    from: `"${fromName}" <${cfg.user}>`,
    to: clientEmail,
    replyTo: cfg.replyTo || cfg.user,
    subject: `Rappel : votre rendez-vous ${type} demain à ${rdv.heureDebut} — ${salonNom}`,
    html,
  });
}

// Job principal : vérifie et envoie les rappels
export async function runRappelsJob(): Promise<void> {
  try {
    const users = await getUsersWithSmtp();
    if (!users.length) return;

    for (const u of users) {
      const rdvsDemain = await getRdvDemain(u.userId);
      for (const rdv of rdvsDemain) {
        const alreadySent = await rappelExists(u.userId, rdv.id);
        if (alreadySent) continue;

        const clientEmail = rdv.clientEmail || await getClientEmail(rdv.clientId, u.userId);
        const now = Date.now();

        if (!clientEmail) {
          await insertRappel({
            id: randomUUID(), userId: u.userId, rdvId: rdv.id,
            rdvDate: rdv.date, rdvHeure: rdv.heureDebut,
            clientNom: rdv.clientNom || null, clientEmail: null,
            sentAt: now, statut: 'ignore',
            errorMessage: "Pas d'adresse email client", createdAt: now,
          });
          continue;
        }

        try {
          await sendRappelEmail(
            { host: u.host, port: u.port, secure: !!u.secure, user: u.user, password: u.password, fromName: u.fromName, replyTo: u.replyTo },
            u.salonNom || 'Studio Manager', rdv, clientEmail
          );
          await insertRappel({
            id: randomUUID(), userId: u.userId, rdvId: rdv.id,
            rdvDate: rdv.date, rdvHeure: rdv.heureDebut,
            clientNom: rdv.clientNom || null, clientEmail,
            sentAt: now, statut: 'envoye', errorMessage: null, createdAt: now,
          });
          console.log(`[Rappels] ✓ Email envoyé à ${clientEmail} pour RDV ${rdv.date} ${rdv.heureDebut}`);
        } catch (err: any) {
          await insertRappel({
            id: randomUUID(), userId: u.userId, rdvId: rdv.id,
            rdvDate: rdv.date, rdvHeure: rdv.heureDebut,
            clientNom: rdv.clientNom || null, clientEmail,
            sentAt: now, statut: 'erreur', errorMessage: err.message, createdAt: now,
          });
          console.error(`[Rappels] ✗ Erreur envoi à ${clientEmail}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error('[Rappels] Erreur job:', err);
  }
}

// Démarre le job planifié (toutes les heures)
export function startRappelsScheduler(): void {
  console.log('[Rappels] Scheduler démarré — vérification toutes les heures');
  runRappelsJob();
  setInterval(runRappelsJob, 60 * 60 * 1000);
}
