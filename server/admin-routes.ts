import { Router } from 'express';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { getDb } from './db';
import { studios, licenses, users } from '../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

const router = Router();

const JWT_SECRET = () => new TextEncoder().encode(process.env.JWT_SECRET || 'Intemporelle2026!');
const ADMIN_USER = process.env.SUPER_ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.SUPER_ADMIN_PASS || 'Intemporelle2026Admin!';

// Middleware auth super-admin
async function superAdminAuth(req: any, res: any, next: any) {
  try {
    const token = req.cookies?.super_admin_session;
    if (!token) return res.status(401).json({ error: 'Non autorisé' });
    const { payload } = await jwtVerify(token, JWT_SECRET());
    if (payload.role !== 'super-admin') return res.status(403).json({ error: 'Accès refusé' });
    next();
  } catch {
    return res.status(401).json({ error: 'Session invalide' });
  }
}

// POST /api/super-admin/login
router.post('/api/super-admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = await new SignJWT({ role: 'super-admin', username })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(JWT_SECRET());
    res.cookie('super_admin_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return res.json({ success: true });
  }
  return res.status(401).json({ error: 'Identifiants incorrects' });
});

// POST /api/super-admin/logout
router.post('/api/super-admin/logout', (_req, res) => {
  res.clearCookie('super_admin_session');
  return res.json({ success: true });
});

// GET /api/super-admin/me
router.get('/api/super-admin/me', superAdminAuth, (_req, res) => {
  return res.json({ username: ADMIN_USER, role: 'super-admin' });
});

// GET /api/super-admin/studios — liste tous les studios
router.get('/api/super-admin/studios', superAdminAuth, async (_req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'Database error' });
    const rows = await db
      .select({
        id: studios.id,
        nom: studios.nom,
        slug: studios.slug,
        email: studios.email,
        adresse: studios.adresse,
        codePostal: studios.codePostal,
        ville: studios.ville,
        telephone: studios.telephone,
        ownerEmail: studios.ownerEmail,
        planType: studios.planType,
        actif: studios.actif,
        isTemporary: studios.isTemporary,
        firstLogin: studios.firstLogin,
        tempPin: studios.tempPin,
        trialEndsAt: studios.trialEndsAt,
        createdAt: studios.createdAt,
        specialites: studios.specialites,
      })
      .from(studios)
      .orderBy(desc(studios.createdAt));
    return res.json(rows);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// POST /api/super-admin/studios — créer un nouveau studio
router.post('/api/super-admin/studios', superAdminAuth, async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'Database error' });

    const { nomSalon, rue, codePostal, ville, telephone, emailSalon, ownerEmail, siret = '', password, pin, planType = 'trial', trialDays = 30, specialites = '' } = req.body;
    const requiredFields = { nomSalon, rue, codePostal, ville, telephone, emailSalon, ownerEmail };
    const missingFields = Object.entries(requiredFields).filter(([, value]) => !String(value || '').trim()).map(([key]) => key);
    if (missingFields.length > 0) return res.status(400).json({ error: `Champs obligatoires manquants : ${missingFields.join(', ')}` });
    if (!password) return res.status(400).json({ error: 'Le mot de passe est obligatoire pour la double sécurité' });
    if (!pin || !/^\d{4}$/.test(pin)) return res.status(400).json({ error: 'Le code PIN à 4 chiffres est obligatoire' });
    const selectedSpecialites = String(specialites || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    if (selectedSpecialites.length === 0) return res.status(400).json({ error: 'Sélectionnez au moins une spécialité' });
    const specialitesCsv = selectedSpecialites.join(',');

    // Le champ historique tempPin alimente la fiche super-admin ; il doit refléter le PIN actif demandé.
    const tempPin = pin;

    // Générer slug unique
    const baseSlug = nomSalon.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 60);
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    // Créer un user temporaire dans users avec openId unique
    const openId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await (db as any).$client.query(
      'INSERT INTO users (openId, name, email, loginMethod, role) VALUES (?, ?, ?, ?, ?)',
      [openId, nomSalon, ownerEmail, 'pin', 'user']
    );

    // Récupérer l'id du user créé
    const newUser = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    const userId = newUser[0].id;

    // Créer le studio lié
    await (db as any).$client.query(
      'INSERT INTO studios (userId, nom, slug, adresse, codePostal, ville, telephone, email, ownerEmail, siret, planType, trialEndsAt, actif, isTemporary, firstLogin, tempPin, specialites) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, nomSalon, slug, rue, codePostal, ville, telephone, emailSalon, ownerEmail, siret || null, planType, trialEndsAt, true, true, true, tempPin, specialitesCsv]
    );

    // Sauvegarder le mot de passe (obligatoire) dans users.passwordHash
    const passwordHash = await bcrypt.hash(password, 10);
    await (db as any).$client.query(
      'UPDATE users SET passwordHash = ? WHERE id = ?',
      [passwordHash, userId]
    );

    // Sauvegarder le PIN hashé dans salon_settings.pinHash
    const pinHash = await bcrypt.hash(pin, 10);
    await (db as any).$client.query(
      'INSERT INTO salon_settings (userId, nom, adresse, codePostal, ville, telephone, email, siret, pinHash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nom = VALUES(nom), adresse = VALUES(adresse), codePostal = VALUES(codePostal), ville = VALUES(ville), telephone = VALUES(telephone), email = VALUES(email), siret = VALUES(siret), pinHash = VALUES(pinHash)',
      [userId, nomSalon, rue, codePostal, ville, telephone, emailSalon, siret || null, pinHash]
    );

    // Créer l'utilisateur admin dans studio_users (nécessaire pour /open et tRPC)
    await (db as any).$client.query(
      'INSERT INTO studio_users (ownerId, prenom, nom, email, login, passwordHash, role, actif, pinHash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, nomSalon, '', ownerEmail, 'admin', passwordHash, 'admin', 1, pinHash]
    );

    return res.json({ success: true, tempPin, slug, ownerEmail, nomSalon });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// PATCH /api/super-admin/studios/:id — modifier un studio
router.patch('/api/super-admin/studios/:id', superAdminAuth, async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'Database error' });
    const id = parseInt(req.params.id);
    const { actif, planType, nom, specialites } = req.body;
    if (specialites !== undefined) {
      const selectedSpecialites = String(specialites || '').split(',').map((s: string) => s.trim()).filter(Boolean);
      if (selectedSpecialites.length === 0) return res.status(400).json({ error: 'Sélectionnez au moins une spécialité' });
      await (db as any).$client.query('UPDATE studios SET specialites = ?, updatedAt = NOW() WHERE id = ?', [selectedSpecialites.join(','), id]);
    }
    if (actif !== undefined || planType || nom) {
      const update: any = { updatedAt: new Date() };
      if (actif !== undefined) update.actif = actif;
      if (planType) update.planType = planType;
      if (nom) update.nom = nom;
      await db.update(studios).set(update).where(eq(studios.id, id));
    }
    // Mettre à jour aussi salon_settings et les coordonnées si fournies
    const { nomSalon, rue, codePostal, ville, telephone, emailSalon, ownerEmail, pin, password } = req.body;
    const hasContactUpdate = [nomSalon, rue, codePostal, ville, telephone, emailSalon, ownerEmail, pin, password].some(value => value !== undefined && value !== null && String(value).trim() !== '');
    if (hasContactUpdate) {
      // Trouver le userId du studio
      const studioRow = await (db as any).$client.query('SELECT userId FROM studios WHERE id = ? LIMIT 1', [id]);
      const userId = studioRow?.[0]?.[0]?.userId;
      if (userId) {
        if (nomSalon) {
          await (db as any).$client.query('UPDATE salon_settings SET nom = ?, updatedAt = NOW() WHERE userId = ?', [nomSalon, userId]);
          await (db as any).$client.query('UPDATE studios SET nom = ?, updatedAt = NOW() WHERE id = ?', [nomSalon, id]);
        }
        const contactFields = { rue, codePostal, ville, telephone, emailSalon };
        const providedContactEntries = Object.entries(contactFields).filter(([, value]) => value !== undefined);
        if (providedContactEntries.length > 0) {
          const missingContactFields = Object.entries(contactFields).filter(([, value]) => value === undefined || !String(value || '').trim()).map(([key]) => key);
          if (missingContactFields.length > 0) return res.status(400).json({ error: `Champs obligatoires manquants : ${missingContactFields.join(', ')}` });
          await (db as any).$client.query('UPDATE studios SET adresse = ?, codePostal = ?, ville = ?, telephone = ?, email = ?, updatedAt = NOW() WHERE id = ?', [rue, codePostal, ville, telephone, emailSalon, id]);
          await (db as any).$client.query('UPDATE salon_settings SET adresse = ?, codePostal = ?, ville = ?, telephone = ?, email = ?, updatedAt = NOW() WHERE userId = ?', [rue, codePostal, ville, telephone, emailSalon, userId]);
        }
        if (pin) {
          const bcrypt = await import('bcryptjs');
          const pinHash = await bcrypt.hash(pin, 10);
          await (db as any).$client.query('UPDATE salon_settings SET pinHash = ?, updatedAt = NOW() WHERE userId = ?', [pinHash, userId]);
          await (db as any).$client.query('UPDATE studio_users SET pinHash = ?, updatedAt = NOW() WHERE ownerId = ? AND role = ? AND actif = 1', [pinHash, userId, 'admin']);
          await (db as any).$client.query('UPDATE studios SET tempPin = ?, updatedAt = NOW() WHERE id = ?', [pin, id]);
        }
        if (password) {
          const bcrypt = await import('bcryptjs');
          const passwordHash = await bcrypt.hash(password, 10);
          await (db as any).$client.query('UPDATE users SET passwordHash = ? WHERE id = ?', [passwordHash, userId]);
        }
        if (ownerEmail) {
          await (db as any).$client.query('UPDATE users SET email = ? WHERE id = ?', [ownerEmail, userId]);
          await (db as any).$client.query('UPDATE studios SET ownerEmail = ? WHERE id = ?', [ownerEmail, id]);
        }
      }
    }
    return res.json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// DELETE /api/super-admin/studios/:id — supprimer un studio
router.delete('/api/super-admin/studios/:id', superAdminAuth, async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'Database error' });
    const id = parseInt(req.params.id);
    await (db as any).$client.query('DELETE FROM studios WHERE id = ?', [id]);
    await (db as any).$client.query('DELETE FROM users WHERE id IN (SELECT userId FROM studios WHERE id = ?)', [id]);
    return res.json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// POST /api/super-admin/notifications — envoyer à tous les studios
router.post('/api/super-admin/notifications', superAdminAuth, async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'Database error' });
    const { titre, message, type = 'info' } = req.body;
    if (!titre || !message) return res.status(400).json({ error: 'titre et message requis' });

    // Récupérer tous les userIds des studios actifs
    const [rows] = await (db as any).$client.query('SELECT userId FROM studios WHERE actif = 1');
    const adminUserId = 1; // super-admin

    for (const row of (rows as any[])) {
      await (db as any).$client.query(
        'INSERT INTO admin_notifications (titre, message, type, targetUserId, lu, createdByUserId) VALUES (?, ?, ?, NULL, 0, ?)',
        [titre, message, type, adminUserId]
      );
    }

    return res.json({ success: true, sent: (rows as any[]).length });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// GET /api/studio-info — récupérer les infos du studio connecté
router.get('/api/studio-info', async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'Database error' });

    // Chercher par session utilisateur d'abord
    const { jwtVerify } = await import('jose');
    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
    const sessionCookie = req.cookies?.local_session;
    
    if (sessionCookie) {
      try {
        const { payload } = await jwtVerify(sessionCookie, JWT_SECRET);
        const openId = ((payload as any).openId || payload.sub) as string | undefined;
        const tokenUserId = (payload as any).userId;

        // Cas 1 : salarié connecté via PIN (userId dans studio_users)
        if (tokenUserId) {
          const [suRows] = await (db as any).$client.query(
            'SELECT ownerId FROM studio_users WHERE id = ? LIMIT 1', [tokenUserId]
          );
          if ((suRows as any[]).length > 0) {
            const ownerId = (suRows as any[])[0].ownerId;
            const [studioRows] = await (db as any).$client.query(
              'SELECT specialites, nom FROM studios WHERE userId = ? LIMIT 1', [ownerId]
            );
            if ((studioRows as any[]).length > 0) {
              const studio = (studioRows as any[])[0];
              return res.json({ specialites: studio.specialites || 'piercing,tatouage,dermographie', nom: studio.nom });
            }
            // Fallback sur salon_settings
            const [ssRows] = await (db as any).$client.query(
              'SELECT nom FROM salon_settings WHERE userId = ? LIMIT 1', [ownerId]
            );
            if ((ssRows as any[]).length > 0) {
              return res.json({ specialites: 'piercing,tatouage,dermographie', nom: (ssRows as any[])[0].nom });
            }
          }
        }

        // Cas 2 : propriétaire connecté via email/password (openId dans users)
        if (openId) {
          const [userRows] = await (db as any).$client.query(
            'SELECT id FROM users WHERE openId = ?', [openId]
          );
          if ((userRows as any[]).length > 0) {
            const userId = (userRows as any[])[0].id;
            const [studioRows] = await (db as any).$client.query(
              'SELECT specialites, nom FROM studios WHERE userId = ?', [userId]
            );
            if ((studioRows as any[]).length > 0) {
              const studio = (studioRows as any[])[0];
              return res.json({ specialites: studio.specialites || 'piercing,tatouage,dermographie', nom: studio.nom });
            }
          }
        }
      } catch {}
    }

    // Fallback sur le cookie temporaire
    const studioId = req.cookies?.temp_studio_id;
    if (studioId) {
      const [rows] = await (db as any).$client.query(
        'SELECT specialites, nom FROM studios WHERE id = ?', [studioId]
      );
      if ((rows as any[]).length > 0) {
        const studio = (rows as any[])[0];
        return res.json({ specialites: studio.specialites || 'piercing,tatouage,dermographie', nom: studio.nom });
      }
    }

    return res.json({ specialites: 'piercing,tatouage,dermographie' });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// POST /api/check-temp-pin — vérifier un PIN temporaire
router.post('/api/check-temp-pin', async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'Database error' });
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ valid: false });
    const [rows] = await (db as any).$client.query(
      'SELECT * FROM studios WHERE tempPin = ? AND isTemporary = 1 AND firstLogin = 1 AND actif = 1',
      [pin]
    );
    if ((rows as any[]).length === 0) return res.json({ valid: false });
    const studio = (rows as any[])[0];
    // Créer une session temporaire
    res.cookie('temp_studio_id', String(studio.id), {
      httpOnly: true, secure: true, sameSite: 'none', maxAge: 10 * 365 * 24 * 60 * 60 * 1000
    });
    return res.json({ valid: true, studioId: studio.id, nom: studio.nom });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// Route changement mot de passe super-admin
router.post('/change-password', async (req: Request, res: Response) => {
  const token = req.cookies?.super_admin_session;
  if (!token) return res.status(401).json({ error: 'Non authentifié' });
  
  const { oldPassword, newPassword } = req.body;
  
  // Vérifier l'ancien mot de passe
  const ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'StudioAdmin2024!';
  if (oldPassword !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Ancien mot de passe incorrect' });
  }
  
  // Sauvegarder le nouveau mot de passe dans .env
  const fs = require('fs');
  const envPath = '/home/ubuntu/app/.env';
  let envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('SUPER_ADMIN_PASSWORD=')) {
    envContent = envContent.replace(/SUPER_ADMIN_PASSWORD=.*/g, `SUPER_ADMIN_PASSWORD=${newPassword}`);
  } else {
    envContent += `
SUPER_ADMIN_PASSWORD=${newPassword}`;
  }
  fs.writeFileSync(envPath, envContent);
  
  return res.json({ success: true });
});


// Route pour réinitialiser le mot de passe d'un studio depuis le Super-Admin
router.post('/api/super-admin/reset-password/:studioId', async (req: Request, res: Response) => {
  const token = req.cookies?.super_admin_session;
  if (!token) return res.status(401).json({ error: 'Non authentifié' });
  const studioId = parseInt(req.params.studioId);
  if (isNaN(studioId)) return res.status(400).json({ error: 'studioId invalide' });
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (min 6 caractères)' });
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'Database error' });
    const [rows] = await (db as any).$client.query('SELECT userId FROM studios WHERE id = ?', [studioId]);
    if ((rows as any[]).length === 0) return res.status(404).json({ error: 'Studio non trouvé' });
    const userId = (rows as any[])[0].userId;
    const passwordHash = await bcrypt.hash(password, 10);
    await (db as any).$client.query('UPDATE users SET passwordHash = ? WHERE id = ?', [passwordHash, userId]);
    return res.json({ success: true, message: `Mot de passe mis à jour pour le studio ${studioId} (userId=${userId})` });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// Route pour configurer le SMTP d'un studio depuis le Super-Admin
router.post('/api/super-admin/set-smtp/:studioId', async (req: Request, res: Response) => {
  const token = req.cookies?.super_admin_session;
  if (!token) return res.status(401).json({ error: 'Non authentifié' });
  const studioId = parseInt(req.params.studioId);
  if (isNaN(studioId)) return res.status(400).json({ error: 'studioId invalide' });
  const { host, port, secure, user, password, fromName, replyTo } = req.body;
  if (!host || !port || !user || !password) {
    return res.status(400).json({ error: 'Champs obligatoires : host, port, user, password' });
  }
  try {
    // Trouver le userId associé à ce studio
    const [rows] = await (db as any).$client.query(
      'SELECT userId FROM studios WHERE id = ?',
      [studioId]
    );
    if ((rows as any[]).length === 0) return res.status(404).json({ error: 'Studio non trouvé' });
    const userId = (rows as any[])[0].userId;
    // Upsert la config SMTP
    await (db as any).$client.query(
      `INSERT INTO smtp_config (userId, host, port, secure, user, password, fromName, replyTo, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         host=VALUES(host), port=VALUES(port), secure=VALUES(secure),
         user=VALUES(user), password=VALUES(password),
         fromName=VALUES(fromName), replyTo=VALUES(replyTo), updatedAt=NOW()`,
      [userId, host, port, secure ? 1 : 0, user, password, fromName || null, replyTo || null]
    );
    return res.json({ success: true, message: `SMTP configuré pour le studio ${studioId} (userId=${userId})` });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// Route d'impersonation — connexion directe à un studio depuis le Super-Admin
router.post('/api/super-admin/open-studio/:studioId', async (req: Request, res: Response) => {
  const token = req.cookies?.super_admin_session;
  if (!token) return res.status(401).json({ error: 'Non authentifié' });
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET());
    if (payload.role !== 'super-admin') return res.status(403).json({ error: 'Accès refusé' });
  } catch { return res.status(401).json({ error: 'Token invalide' }); }

  const studioId = parseInt(req.params.studioId);
  if (isNaN(studioId)) return res.status(400).json({ error: 'studioId invalide' });

  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'Database error' });

    // Récupérer le userId du studio
    const [rows] = await (db as any).$client.query(
      'SELECT u.id as userId, u.openId, u.email, u.name FROM studios s JOIN users u ON s.userId = u.id WHERE s.id = ? LIMIT 1',
      [studioId]
    );
    if ((rows as any[]).length === 0) return res.status(404).json({ error: 'Studio non trouvé' });
    const user = (rows as any[])[0];

    // Générer un JWT de session pour ce studio (8h)
    const sessionToken = await new SignJWT({ openId: user.openId, userId: user.userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('8h')
      .sign(JWT_SECRET());

    // Poser le cookie local_session
    res.cookie('local_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
    });

    return res.json({ success: true, name: user.name, email: user.email });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});


// GET /api/super-admin/studios/:id/open — connexion automatique super-admin vers un studio
router.get('/api/super-admin/studios/:id/open', superAdminAuth, async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'Database error' });
    const id = parseInt(req.params.id);
    // Récupérer le userId du studio
    const [studioRows] = await (db as any).$client.query(
      'SELECT userId, nom FROM studios WHERE id = ? LIMIT 1', [id]
    );
    if (!(studioRows as any[]).length) return res.status(404).json({ error: 'Studio non trouvé' });
    const ownerId = (studioRows as any[])[0].userId;
    // Récupérer le salarié admin du studio
    const [suRows] = await (db as any).$client.query(
      'SELECT id, prenom, nom, role FROM studio_users WHERE ownerId = ? AND role = ? AND actif = 1 LIMIT 1',
      [ownerId, 'admin']
    );
    if (!(suRows as any[] ).length) {
      const [userInfo] = await (db as any).$client.query("SELECT name, passwordHash FROM users WHERE id = ? LIMIT 1", [ownerId]);
      const userName = userInfo.length ? (userInfo[0].name || "Admin") : "Admin";
      const ownerPasswordHash = userInfo.length ? (userInfo[0].passwordHash || "") : "";
      const parts = userName.split(" ");
      const prenom = parts[0] || "Admin";
      const nom = parts.slice(1).join(" ") || "";
      await (db as any).$client.query("INSERT INTO studio_users (ownerId, prenom, nom, login, passwordHash, role, actif, isTemporary, firstLogin) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)", [ownerId, prenom, nom, "admin", ownerPasswordHash, "admin", 1]);
      const [newSuRows] = await (db as any).$client.query("SELECT id, prenom, nom, role FROM studio_users WHERE ownerId = ? AND role = ? AND actif = 1 LIMIT 1", [ownerId, "admin"]);
      if (!(newSuRows as any[]).length) return res.status(404).json({ error: "Echec de la creation automatique de l admin" });
    }
    // Récupérer le openId du studio depuis la table users
    const [userRows] = await (db as any).$client.query(
      'SELECT openId FROM users WHERE id = ? LIMIT 1', [ownerId]
    );
    const studioOpenId = userRows.length ? userRows[0].openId : ownerId.toString();
    // Générer un token de session avec le bon userId (ownerId du studio)
    const token = await new SignJWT({ openId: studioOpenId, userId: ownerId })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('8h')
      .sign(JWT_SECRET());
    // Poser le cookie et rediriger vers le tableau de bord
    res.cookie('local_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
      domain: '.intemporelle.eu',
    } );
    const referer = req.headers.referer || req.headers.origin || 'https://studio.intemporelle.eu';
    const baseUrl = referer.includes('app.intemporelle.eu') ? 'https://app.intemporelle.eu' : 'https://studio.intemporelle.eu';
    return res.redirect(baseUrl + '/');
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
