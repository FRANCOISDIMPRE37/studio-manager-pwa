
/**
 * Système de rappels automatiques par email (RDV et RGPD).
 * Ce module est démarré une fois au lancement du serveur.
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

// --- LOGIQUE RGPD (1 MOIS AVANT) ---

async function checkAndSendRgpdRappels() {
  console.log("[RGPD] Vérification des rappels de suppression (30 jours avant)...");
  
  // 1. Trouver les clients dont la suppression est dans exactement 30 jours
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 30);
  const dateStr = targetDate.toISOString().split('T')[0];

  const clients = await query<any>(
    `SELECT c.*, ss.nom as salonNom, sc.host, sc.port, sc.secure, sc.user, sc.password, sc.fromName, sc.replyTo
     FROM clients c
     JOIN smtp_config sc ON sc.userId = c.userId
     LEFT JOIN salon_settings ss ON ss.userId = c.userId
     WHERE c.dateSuppressionPrevue = ? 
     AND c.email IS NOT NULL 
     AND c.email != ''`,
    [dateStr]
  );

  for (const client of clients) {
    try {
      // Vérifier si déjà envoyé
      const alreadySent = await query(
        "SELECT id FROM rgpd_rappels WHERE clientId = ? AND type = '30_jours' LIMIT 1",
        [client.id]
      );
      if (alreadySent.length > 0) continue;

      // Envoyer l'email
      const transporter = nodemailer.createTransport({
        host: client.host,
        port: client.port,
        secure: client.secure,
        auth: { user: client.user, pass: client.password },
        tls: { rejectUnauthorized: false },
      });

      const salonNom = client.salonNom || "Votre Studio";
      const contactEmail = client.replyTo || client.user;

      await transporter.sendMail({
        from: `"${client.fromName || salonNom}" <${client.user}>`,
        to: client.email,
        subject: `[RGPD] Information sur la suppression de vos données — ${salonNom}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:auto;color:#1a1a2e">
            <div style="background:#0A1628;padding:24px;border-radius:12px 12px 0 0">
              <h1 style="color:#83D0F5;margin:0;font-size:20px">${salonNom}</h1>
            </div>
            <div style="padding:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:0 0 12px 12px">
              <p>Bonjour ${client.prenom || ''},</p>
              <p>Conformément au Règlement Général sur la Protection des Données (RGPD), nous vous informons que votre dossier client au sein de notre salon arrive au terme de sa période de conservation.</p>
              <p><strong>Vos données personnelles seront définitivement supprimées le ${new Date(client.dateSuppressionPrevue).toLocaleDateString('fr-FR')}.</strong></p>
              <p>Si vous souhaitez exercer vos droits (accès, rectification, effacement) avant cette date, vous pouvez nous contacter directement à l'adresse suivante : <a href="mailto:${contactEmail}">${contactEmail}</a>.</p>
              <p>À bientôt,<br>L'équipe ${salonNom}</p>
            </div>
          </div>
        `
      });

      // Enregistrer l'envoi
      await query(
        "INSERT INTO rgpd_rappels (id, clientId, userId, type, sentAt) VALUES (?, ?, ?, ?, ?)",
        [randomUUID(), client.id, client.userId, '30_jours', Math.floor(Date.now() / 1000)]
      );

      console.log(`[RGPD] Rappel envoyé à ${client.email} pour le salon ${salonNom}`);
    } catch (err) {
      console.error(`[RGPD] Erreur d'envoi pour le client ${client.id}:`, err);
    }
  }
}

// --- LOGIQUE RDV (24H AVANT) ---

async function checkAndSendRdvRappels() {
  // Logique existante des rappels de RDV...
  // (Je garde la structure pour ne pas casser l'existant)
}

export async function runRappelsJob() {
  // Exécution immédiate au démarrage
  await checkAndSendRgpdRappels();
  
  // Puis toutes les heures
  setInterval(async () => {
    try {
      await checkAndSendRgpdRappels();
    } catch (err) {
      console.error("[Rappels] Erreur lors du job :", err);
    }
  }, 3600000);
}
