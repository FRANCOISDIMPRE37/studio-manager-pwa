import type { CookieOptions, Request } from "express";

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure" | "maxAge"> {
  const secure = isSecureRequest(req);
  return {
    httpOnly: true,
    path: "/",
    // Utilisation de SameSite=None pour garantir l'envoi des cookies lors des appels API tRPC
    // Nécessite l'attribut Secure=true
    sameSite: secure ? "none" : "lax",
    secure: secure,
    maxAge: ONE_YEAR_MS,
  };
}
