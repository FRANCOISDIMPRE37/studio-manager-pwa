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

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "Intemporelle2026!"
);

async function authenticateLocal(req: any): Promise<User | null> {
  try {
    const cookieHeader = req.headers.cookie || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c: string) => {
        const [k, ...v] = c.trim().split("=");
        return [k, v.join("=")];
      })
    );
    const token = cookies["local_session"];
    console.log("[LocalAuth] Cookie header:", cookieHeader.substring(0, 100));
    console.log("[LocalAuth] Token found:", !!token);
    if (!token) return null;
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.openId) return null;
    const user = await db.getUserByOpenId(payload.openId as string);
    return user || null;
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
