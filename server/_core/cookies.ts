import type { CookieOptions, Request } from "express";
import { ONE_YEAR_MS } from "@shared/const";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");
  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure" | "maxAge"> {
  return {
    domain: ".intemporelle.eu",
    httpOnly: true,
    path: "/",
    // iPad/Safari est plus fiable en contexte first-party avec SameSite=Lax.
    // Cela évite les comportements ITP/None tout en gardant la session sur app.intemporelle.eu.
    sameSite: "lax",
    secure: isSecureRequest(req),
    maxAge: ONE_YEAR_MS,
  };
}
