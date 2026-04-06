import { Router } from 'express';
import { SignJWT } from 'jose';

const router = Router();

// Login super-admin
router.post('/api/super-admin/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'Fd031944') {
    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'Intemporelle2026!');
    const token = await new SignJWT({ role: 'super-admin', username: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(JWT_SECRET);
    
    res.cookie('super_admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });
    
    return res.json({ success: true });
  }
  
  res.status(401).json({ error: 'Invalid credentials' });
});

// Liste des studios
router.get('/api/super-admin/studios', async (req, res) => {
  const db = await import('./db').then(m => m.getDb());
  if (!db) return res.status(500).json({ error: 'Database error' });
  
  const studios = await db.query('SELECT id, nom, email, slug, createdAt FROM studios ORDER BY createdAt DESC');
  
  res.json(studios);
});

export default router;
