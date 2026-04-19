import { Router } from 'express';
import { SignJWT, jwtVerify } from 'jose';
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

    const { nomSalon, ownerEmail, planType = 'trial', trialDays = 30, specialites = 'piercing,tatouage,dermographie' } = req.body;
    if (!nomSalon || !ownerEmail) return res.status(400).json({ error: 'nomSalon et ownerEmail requis' });

    // Générer un PIN temporaire à 6 chiffres
    const tempPin = Math.floor(1000 + Math.random() * 9000).toString();

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
      'INSERT INTO studios (userId, nom, slug, email, ownerEmail, planType, trialEndsAt, actif, isTemporary, firstLogin, tempPin, specialites) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, nomSalon, slug, ownerEmail, ownerEmail, planType, trialEndsAt, true, true, true, tempPin, specialites]
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
      await (db as any).$client.query('UPDATE studios SET specialites = ?, updatedAt = NOW() WHERE id = ?', [specialites, id]);
    }
    if (actif !== undefined || planType || nom) {
      const update: any = { updatedAt: new Date() };
      if (actif !== undefined) update.actif = actif;
      if (planType) update.planType = planType;
      if (nom) update.nom = nom;
      await db.update(studios).set(update).where(eq(studios.id, id));
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
        const openId = payload.sub as string;
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

export default router;
