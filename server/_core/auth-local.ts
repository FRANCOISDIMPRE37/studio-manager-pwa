import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb } from '../db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import mysql from 'mysql2/promise';

const JWT_SECRET = process.env.JWT_SECRET || 'Intemporelle2026SecretKey!';
const COOKIE_NAME = 'studio_session';

export async function loginWithEmail(email: string, password: string): Promise<string | null> {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  const [rows] = await conn.query('SELECT * FROM users WHERE email = ?', [email]) as any;
  await conn.end();
  
  const user = (rows as any[])[0];
  if (!user) return null;
  
  // Vérifier le mot de passe
  if (user.passwordHash) {
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;
  }
  
  // Générer un token JWT
  const token = jwt.sign(
    { openId: user.openId, userId: user.id },
    JWT_SECRET,
    { expiresIn: '365d' }
  );
  
  return token;
}

export function verifyLocalToken(token: string): { openId: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    return { openId: payload.openId };
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
