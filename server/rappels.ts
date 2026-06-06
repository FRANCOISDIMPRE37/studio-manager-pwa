
/**
 * Système de rappels automatiques par email (RGPD UNIQUEMENT).
 * Ce module est démarré une fois au lancement du serveur.
 * TOUT AUTRE ENVOI (RDV, DOCUMENTS) EST STRICTEMENT INTERDIT.
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
    console.error("[Rappels] SQL Error:", err);
    return [];
  }
}

// --- LOGIQUE RGPD (1 MOIS AVANT) - SEULE FONCTION AUTORISÉE ---

async function checkAndSendRgpdRappels() {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 30);
  const dateStr = targetDate.toISOString().split('T')[0];
  
  console.log(`[RGPD] Recherche des clients pour la date de suppression : ${dateStr}`);

  // On récupère les clients dont la suppression est prévue dans 30 jours
  const clients = await query<any>(
    `SELECT c.*, s.nom as studioNom, s.adresse as studioAdresse, s.codePostal as studioCP, s.ville as studioVille, s.telephone as studioTel, s.email as studioEmail
     FROM clients c
     LEFT JOIN salon_settings s ON s.userId = c.userId
     WHERE c.dateSuppressionPrevue = ? 
     AND c.email IS NOT NULL 
     AND c.email != ''`,
    [dateStr]
  );

  console.log(`[RGPD] Nombre de clients trouvés : ${clients.length}`);

  if (clients.length === 0) return;

  // Configuration SMTP IONOS (Mode Caché)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ionos.fr",
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: true, // SSL/TLS
    auth: {
      user: process.env.SMTP_USER || "piercing-tatouage-dermographie@studiomanagereurope.eu",
      pass: process.env.SMTP_PASS || "M@tdepasseionos37",
    },
    tls: { rejectUnauthorized: false },
    debug: true,
    logger: true
  });

  for (const client of clients) {
    try {
      console.log(`[RGPD] Traitement du client : ${client.email}`);
      
      // Vérifier si un rappel a déjà été envoyé pour ce client
      const alreadySent = await query(
        "SELECT id FROM rgpd_rappels WHERE clientId = ? AND type = '30_jours' LIMIT 1",
        [client.id]
      );
      
      if (alreadySent.length > 0) {
        console.log(`[RGPD] Rappel déjà envoyé pour ${client.email}, on passe.`);
        continue;
      }

      const clientNomComplet = `${client.prenom || ''} ${client.nom || ''}`.trim().toUpperCase() || "CLIENT";
      const dateSuppression = new Date(client.dateSuppressionPrevue).toLocaleDateString('fr-FR');
      
      // Infos du studio par défaut si non renseignées
      const studioNom = client.studioNom || "Studio Intemporelle";
      const studioEmail = client.studioEmail || "contact@studiomanagereurope.eu";
      const studioTel = client.studioTel || "0617074169";
      const studioAdresse = `${client.studioAdresse || '3 rue de tours'}, ${client.studioCP || '37000'} ${client.studioVille || 'TOURS'}`;

      console.log(`[RGPD] Tentative d'envoi mail à ${client.email}...`);

      await transporter.sendMail({
        from: `"${studioNom}" <${process.env.SMTP_USER || 'piercing-tatouage-dermographie@studiomanagereurope.eu'}>`,
        to: client.email,
        subject: `⚠️ Suppression de vos données personnelles — Dans 30 jours`,
        text: `Bonjour ${clientNomComplet},

Nous vous informons que conformément au RGPD et à notre politique de conservation des données, 

Vos données personnelles enregistrées dans notre salon seront supprimées dans 30 jours, soit le ${dateSuppression}.

Si vous souhaitez exercer vos droits (accès) veuillez nous contacter avant cette date.

Pour exercer vos droits, contactez-nous à : mailto:${studioEmail}

Cordialement,
${studioNom}
${studioAdresse}
${studioTel}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:auto;color:#1a1a2e;line-height:1.6">
            <div style="background:#0A1628;padding:24px;border-radius:12px 12px 0 0">
              <h1 style="color:#83D0F5;margin:0;font-size:20px">${studioNom}</h1>
            </div>
            <div style="padding:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:0 0 12px 12px">
              <p>Bonjour <strong>${clientNomComplet}</strong>,</p>
              <p>Nous vous informons que conformément au <strong>RGPD</strong> et à notre politique de conservation des données,</p>
              <p>Vos données personnelles enregistrées dans notre salon seront supprimées dans 30 jours, soit le <strong>${dateSuppression}</strong>.</p>
              <p>Si vous souhaitez exercer vos droits (accès) veuillez nous contacter avant cette date.</p>
              <p>Pour exercer vos droits, contactez-nous à : <a href="mailto:${studioEmail}" style="color:#0A1628;font-weight:bold">${studioEmail}</a></p>
              <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
              <p style="font-size:13px;color:#666">
                Cordialement,<br>
                <strong>${studioNom}</strong><br>
                ${studioAdresse}<br>
                ${studioTel}
              </p>
            </div>
          </div>
        `
      });

      console.log(`[RGPD] Mail envoyé avec succès à ${client.email}`);

      // Enregistrer l'envoi dans la base de données
      await query(
        "INSERT INTO rgpd_rappels (id, clientId, userId, type, sentAt) VALUES (?, ?, ?, ?, ?)",
        [randomUUID(), client.id, client.userId, '30_jours', Math.floor(Date.now() / 1000)]
      );

    } catch (err) {
      console.error(`[RGPD] Erreur d'envoi pour le client ${client.id}:`, err);
    }
  }
}

export async function runRappelsJob() {
  // Premier passage au démarrage
  await checkAndSendRgpdRappels();
  
  // Vérification toutes les heures
  setInterval(async () => {
    try {
      await checkAndSendRgpdRappels();
    } catch (err) {
      // Erreur silencieuse
    }
  }, 3600000);
}
