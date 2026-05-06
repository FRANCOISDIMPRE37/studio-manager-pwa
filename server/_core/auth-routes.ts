import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { getDb } from "../db";
import { auditLogs } from "../../drizzle/schema";
async function logAudit(db: any, action: string, req: any, success: boolean, details?: string, userId?: number, studioUserId?: number) {
  try {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.ip || "unknown";
    const userAgent = (req.headers["user-agent"] as string)?.substring(0, 500) || "";
    await db.insert(auditLogs).values({ action, ip, userAgent, success, details, userId, studioUserId });
  } catch (e) { console.error("[Audit] Erreur:", e); }
}

import rateLimit from "express-rate-limit";

const pinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Trop de tentatives, réessayez dans 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

if (!process.env.JWT_SECRET) throw new Error("❌ JWT_SECRET manquant dans .env");
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "DB non disponible" });

      const [rows] = await (db as any).$client.query(
        "SELECT * FROM users WHERE email = ? LIMIT 1", [email]
      );
      const user = (rows as any[])[0];

      if (!user) return res.status(401).json({ error: "Email ou mot de passe incorrect" });

      if (!user.passwordHash) {
        return res.status(401).json({ error: "Aucun mot de passe configuré pour ce compte. Contactez votre administrateur." });
      }
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ error: "Email ou mot de passe incorrect" });

      const token = await new SignJWT({ openId: user.openId, userId: user.id })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("8h")
        .sign(JWT_SECRET);

      res.cookie("local_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 365 * 24 * 60 * 60 * 1000,
      });

      const dbA = await getDb(); if(dbA) await logAudit(dbA, "login_email", req, true, user.email, user.id);
      return res.json({ success: true, name: user.name, email: user.email });
    } catch (err: any) {
      console.error("[Auth] Login error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/pin", pinLimiter, async (req: Request, res: Response) => {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ error: "PIN requis" });
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "DB non disponible" });
      const [rows] = await (db as any).$client.query("SELECT * FROM studio_users WHERE actif = 1");
      for (const user of rows as any[]) {
        if (user.pinHash && await bcrypt.compare(pin, user.pinHash)) {
          const token = await new SignJWT({ openId: user.id.toString(), userId: user.id }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("30d").sign(JWT_SECRET);
          res.cookie("local_session", token, { httpOnly: true, secure: true, sameSite: "none", maxAge: 365 * 24 * 60 * 60 * 1000 });
          const dbC = await getDb(); if(dbC) await logAudit(dbC, "login_pin", req, true, undefined, undefined, user.id);
          return res.json({ success: true, name: user.prenom + " " + user.nom, role: user.role });
        }
      }
      const dbB = await getDb(); if(dbB) await logAudit(dbB, "login_pin_failed", req, false);
      return res.status(401).json({ error: "PIN incorrect" });
    } catch (err: any) {
      console.error("[Auth] PIN login error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Vérification du PIN studio (stocké dans salon_settings.pinHash)
  app.post("/api/auth/verify-pin", pinLimiter, async (req: Request, res: Response) => {
    const { email, pin } = req.body;
    if (!pin || pin.length !== 4) return res.status(400).json({ error: "PIN à 4 chiffres requis" });
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "DB non disponible" });

      // Si email fourni : vérifier le PIN du studio lié à cet email
      // Sinon : vérifier dans tous les studios actifs
      let query = "SELECT ss.pinHash, u.email FROM salon_settings ss JOIN users u ON ss.userId = u.id WHERE ss.pinHash IS NOT NULL";
      const params: any[] = [];
      if (email) {
        query += " AND u.email = ? LIMIT 1";
        params.push(email);
      } else {
        query += " LIMIT 50";
      }

      const [rows] = await (db as any).$client.query(query, params);
      for (const row of rows as any[]) {
        if (row.pinHash && await bcrypt.compare(pin, row.pinHash)) {
          await logAudit(db, "verify_pin_ok", req, true, row.email);
          return res.json({ valid: true });
        }
      }
      await logAudit(db, "verify_pin_failed", req, false);
      return res.status(401).json({ valid: false, error: "Code PIN incorrect" });
    } catch (err: any) {
      console.error("[Auth] verify-pin error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    res.clearCookie("local_session");
    res.json({ success: true });
  });
}
