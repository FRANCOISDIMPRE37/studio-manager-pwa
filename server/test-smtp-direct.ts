
import "dotenv/config";
import nodemailer from "nodemailer";

async function testSMTP() {
  console.log("Tentative de connexion SMTP IONOS...");
  console.log("Host:", process.env.SMTP_HOST || "smtp.ionos.fr");
  console.log("User:", process.env.SMTP_USER);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ionos.fr",
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    debug: true,
    logger: true,
  });

  try {
    await transporter.verify();
    console.log("✅ Connexion SMTP réussie !");
    
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Studio Intemporelle'}" <${process.env.SMTP_USER}>`,
      to: "francois@dimpre.fr",
      subject: "Test de connexion SMTP IONOS",
      text: "Ceci est un test pour vérifier la configuration SMTP.",
    });
    console.log("✅ Mail envoyé avec succès :", info.messageId);
  } catch (error) {
    console.error("❌ Échec de la connexion ou de l'envoi SMTP :");
    console.error(error);
  }
}

testSMTP();
