import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// Bypass login endpoint — remplace Manus OAuth
export function registerBypassLogin(app: Express) {
  app.get('/api/auth/direct-login', async (req: Request, res: Response) => {
    const secret = req.query['secret'];
    if (secret !== process.env.JWT_SECRET) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    try {
      const openId = process.env.OWNER_OPEN_ID || 'admin-intemporelle';
      await db.upsertUser({
        openId,
        name: 'Admin',
        email: null,
        loginMethod: 'direct',
        lastSignedIn: new Date(),
      });
      const sessionToken = await sdk.createSessionToken(openId, {
        name: 'Admin',
        expiresInMs: 1000 * 60 * 60 * 24 * 365,
      });
      res.cookie('app_session_id', sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 365,
        path: '/',
      });
      res.redirect(302, '/');
    } catch (error) {
      console.error('[DirectLogin] Failed', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });
}
