
import "dotenv/config";
import mysql from "mysql2/promise";
import nodemailer from "nodemailer";
import { randomUUID } from "crypto";

async function test() {
  console.log("Démarrage du test RGPD forcé...");
  
  const connection = await mysql.createConnection(process.env.DATABASE_URL + "?ssl={\"rejectUnauthorized\":false}");
  
  // On cherche le client TEST A (J30)
  const [clients]: any = await connection.execute(
    `SELECT c.*, s.nom as studioNom, s.adresse as studioAdresse, s.codePostal as studioCP, s.ville as studioVille, s.telephone as studioTel, s.email as studioEmail
     FROM clients c
     LEFT JOIN salon_settings s ON s.userId = c.userId
     WHERE c.nom = 'TEST A (J30)'`
  );

  console.log(`Clients trouvés : ${clients.length}`);
  if (clients.length === 0) process.exit(1);

  const client = clients[0];
  console.log(`Envoi test à : ${client.email} pour le studio : ${client.studioNom}`);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ionos.fr",
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    debug: true,
    logger: true
  });

  const clientNomComplet = `${client.prenom || ''} ${client.nom || ''}`.trim().toUpperCase();
  const dateSuppression = new Date(client.dateSuppressionPrevue).toLocaleDateString('fr-FR');
  const studioNom = client.studioNom || "Studio Intemporelle";
  const studioEmail = client.studioEmail || "contact@studiomanagereurope.eu";
  const studioTel = client.studioTel || "0617074169";
  const studioAdresse = `${client.studioAdresse || '3 rue de tours'}, ${client.studioCP || '37000'} ${client.studioVille || 'TOURS'}`;

  try {
    await transporter.sendMail({
      from: `"${studioNom}" <${process.env.SMTP_USER}>`,
      to: client.email,
      subject: `⚠️ Suppression de vos données personnelles — Dans 30 jours`,
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
    console.log("✅ Mail envoyé !");
  } catch (err) {
    console.error("❌ Erreur :", err);
  }
  
  await connection.end();
}

test();
