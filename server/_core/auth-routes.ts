import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { getDb } from "../db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "Intemporelle2026!"
);

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

      if (user.passwordHash) {
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).json({ error: "Email ou mot de passe incorrect" });
      }

      const token = await new SignJWT({ openId: user.openId, userId: user.id })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("365d")
        .sign(JWT_SECRET);

      res.cookie("local_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 365 * 24 * 60 * 60 * 1000,
      });

      return res.json({ success: true, name: user.name, email: user.email });
    } catch (err: any) {
      console.error("[Auth] Login error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/pin", async (req: Request, res: Response) => {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ error: "PIN requis" });
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "DB non disponible" });
      const [rows] = await (db as any).$client.query("SELECT * FROM studio_users WHERE actif = 1");
      for (const user of rows as any[]) {
        if (user.pinHash && await bcrypt.compare(pin, user.pinHash)) {
          const token = await new SignJWT({ openId: user.id.toString(), userId: user.id }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("365d").sign(JWT_SECRET);
          res.cookie("local_session", token, { httpOnly: true, secure: true, sameSite: "none", maxAge: 365 * 24 * 60 * 60 * 1000 });
          return res.json({ success: true, name: user.prenom + " " + user.nom, role: user.role });
        }
      }
      return res.status(401).json({ error: "PIN incorrect" });
    } catch (err: any) {
      console.error("[Auth] PIN login error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    res.clearCookie("local_session");
    res.json({ success: true });
  });
}
