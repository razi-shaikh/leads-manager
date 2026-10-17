import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

import { env } from "@/lib/env";

// SOT:auth SOT:session
// WHAT: Single-user auth — credential check, signed cookie session, route guard.
// WHY:  One fixed login (env vars); session proves authentication on every surface.
// HOW:  loginAction verifies → createSessionCookie; requireSession() guards all
//       protected actions/pages; proxy.ts only checks cookie presence (fast path).
// WHERE: Used by login actions, (app) layout/pages, and all protected services.

export const SESSION_COOKIE = "lm_session";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function signingKey(): Uint8Array {
  return new TextEncoder().encode(env.SESSION_SECRET);
}

function usernamesEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ha, hb);
}

/** Timing-safe username compare + bcrypt password check. Always runs both. */
export async function verifyCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  const userOk = usernamesEqual(username, env.APP_USERNAME);
  const passOk = await bcrypt.compare(password, env.APP_PASSWORD_HASH);
  return userOk && passOk;
}

export async function createSessionCookie(username: string): Promise<void> {
  const token = await new SignJWT({ sub: username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(signingKey());
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<{ username: string } | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, signingKey(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.sub !== "string" || !payload.sub) return null;
    return { username: payload.sub };
  } catch {
    return null;
  }
}

/** Guard for every protected page, action, and handler. Never rely on proxy alone. */
export async function requireSession(): Promise<{ username: string }> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
