import { Router } from 'express';
import bcrypt from 'bcryptjs';

const router = Router();

// Middleware d'authentification
async function authMiddleware(req: any, res: any, next: any) {
  try {
    const token = req.cookies?.local_session;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { jwtVerify } = await import('jose');
    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'Intemporelle2026!');
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    req.ownerId = payload.studioId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}


// Liste des employés du studio
router.get('/api/employees', authMiddleware, async (req, res) => {
  const db = await import('./db').then(m => m.getDb());
  if (!db) return res.status(500).json({ error: 'Database error' });
  
  const ownerId = (req as any).ownerId;
  if (!ownerId) return res.status(401).json({ error: 'Unauthorized' });
  
  const employees = await db.query('SELECT id, prenom, nom, adresse, codePostal, ville, email, pin, typeContrat, documentConfidentialiteSigne, createdAt FROM employees WHERE ownerId = ?', [ownerId]);
  res.json(employees);
});

// Créer un employé
router.post('/api/employees', authMiddleware, async (req, res) => {
  const db = await import('./db').then(m => m.getDb());
  if (!db) return res.status(500).json({ error: 'Database error' });
  
  const ownerId = (req as any).ownerId;
  if (!ownerId) return res.status(401).json({ error: 'Unauthorized' });
  
  const { prenom, nom, adresse, codePostal, ville, email, pin, password, typeContrat } = req.body;
  
  if (!prenom || !nom || !pin || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    return res.status(400).json({ error: 'PIN must be 4 digits' });
  }
  
  const passwordHash = await bcrypt.hash(password, 10);
  const pinHash = await bcrypt.hash(pin, 10);
  
  try {
    const result = await db.query(
      'INSERT INTO employees (prenom, nom, adresse, codePostal, ville, email, pin, passwordHash, typeContrat, ownerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [prenom, nom, adresse, codePostal, ville, email, pinHash, passwordHash, typeContrat || 'employe', ownerId]
    );
    
    res.json({ success: true, id: result.insertId });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ce code PIN existe déjà pour ce studio' });
    }
    throw err;
  }
});

// Modifier un employé
router.put('/api/employees/:id', authMiddleware, async (req, res) => {
  const db = await import('./db').then(m => m.getDb());
  if (!db) return res.status(500).json({ error: 'Database error' });
  
  const ownerId = (req as any).ownerId;
  if (!ownerId) return res.status(401).json({ error: 'Unauthorized' });
  
  const { id } = req.params;
  const { prenom, nom, adresse, codePostal, ville, email, pin, password, typeContrat } = req.body;
  
  let query = 'UPDATE employees SET prenom = ?, nom = ?, adresse = ?, codePostal = ?, ville = ?, email = ?, pin = ?, typeContrat = ?';
  let params: any[] = [prenom, nom, adresse, codePostal, ville, email, pin, typeContrat];
  
  if (password) {
    const passwordHash = await bcrypt.hash(password, 10);
    query += ', passwordHash = ?';
    params.push(passwordHash);
  }
  
  query += ' WHERE id = ? AND ownerId = ?';
  params.push(id, ownerId);
  
  await db.query(query, params);
  res.json({ success: true });
});

// Supprimer un employé
router.delete('/api/employees/:id', authMiddleware, async (req, res) => {
  const db = await import('./db').then(m => m.getDb());
  if (!db) return res.status(500).json({ error: 'Database error' });
  
  const ownerId = (req as any).ownerId;
  if (!ownerId) return res.status(401).json({ error: 'Unauthorized' });
  
  const { id } = req.params;
  await db.query('DELETE FROM employees WHERE id = ? AND ownerId = ?', [id, ownerId]);
  res.json({ success: true });
});

// Signer le document de confidentialité
router.post('/api/employees/:id/sign-confidentiality', authMiddleware, async (req, res) => {
  const db = await import('./db').then(m => m.getDb());
  if (!db) return res.status(500).json({ error: 'Database error' });
  
  const { id } = req.params;
  const { signature } = req.body;
  
  await db.query(
    'UPDATE employees SET documentConfidentialiteSigne = TRUE, signatureConfidentialite = ?, dateSignatureConfidentialite = NOW() WHERE id = ?',
    [signature, id]
  );
  
  res.json({ success: true });
});

// Connexion employé par email/mot de passe
router.post('/api/employees/login', async (req, res) => {
  const db = await import('./db').then(m => m.getDb());
  if (!db) return res.status(500).json({ error: 'Database error' });
  
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }
  
  const employees = await db.query('SELECT * FROM employees WHERE email = ?', [email]);
  
  if (employees.length === 0) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }
  
  const employee = employees[0];
  const isValid = await bcrypt.compare(password, employee.passwordHash);
  
  if (!isValid) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }
  
  if (!employee.documentConfidentialiteSigne) {
    return res.json({ success: true, needsSignature: true, employeeId: employee.id });
  }
  
  const { SignJWT } = await import('jose');
  const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'Intemporelle2026!');
  
  const token = await new SignJWT({ 
    employeeId: employee.id, 
    ownerId: employee.ownerId,
    role: 'employee'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
  
  res.cookie('employee_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  
  res.json({ success: true, employee: { id: employee.id, prenom: employee.prenom, nom: employee.nom } });
});

export default router;
