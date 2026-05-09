import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { jwtVerify } from "jose";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

if (!process.env.JWT_SECRET) throw new Error("❌ JWT_SECRET manquant dans .env");
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function getOwnerUserFromStudioUserId(rawId: unknown): Promise<User | null> {
  const studioUserId = Number(rawId);
  if (!Number.isFinite(studioUserId) || studioUserId <= 0) return null;
  try {
    const database = await db.getDb();
    if (!database) return null;
    const [rows] = await (database as any).$client.query(
      "SELECT ownerId FROM studio_users WHERE id = ? AND actif = 1 LIMIT 1",
      [studioUserId]
    );
    const ownerId = (rows as any[])[0]?.ownerId;
    if (!ownerId) return null;
    return (await db.getUserById(Number(ownerId))) || null;
  } catch {
    return null;
  }
}

async function authenticateLocal(req: any): Promise<User | null> {
  try {
    const cookieHeader = req.headers.cookie || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").filter(Boolean).map((c: string) => {
        const [k, ...v] = c.trim().split("=");
        return [k, v.join("=")];
      })
    );

    // Cohérence PC/iPad : toutes les variantes de reconnexion valides doivent
    // retrouver le propriétaire cloud du studio, sinon les clients semblent
    // disparaître après déconnexion/reconnexion sur un autre appareil.
    const token = cookies["local_session"] || cookies["employee_session"];
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.ownerId) {
      const owner = await db.getUserById(Number(payload.ownerId));
      if (owner) return owner;
    }

    if (payload.openId) {
      const directUser = await db.getUserByOpenId(payload.openId as string);
      if (directUser) return directUser;

      const ownerFromStudioOpenId = await getOwnerUserFromStudioUserId(payload.openId);
      if (ownerFromStudioOpenId) return ownerFromStudioOpenId;
    }

    if (payload.employeeId) {
      const ownerFromEmployee = await getOwnerUserFromStudioUserId(payload.employeeId);
      if (ownerFromEmployee) return ownerFromEmployee;
    }

    if (payload.userId) {
      const directUser = await db.getUserById(Number(payload.userId));
      if (directUser) return directUser;

      const ownerFromStudioUserId = await getOwnerUserFromStudioUserId(payload.userId);
      if (ownerFromStudioUserId) return ownerFromStudioUserId;
    }

    return null;
  } catch {
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  user = await authenticateLocal(opts.req);
  if (!user) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      user = null;
    }
  }
  return { req: opts.req, res: opts.res, user };
}
