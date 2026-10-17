"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  createSessionCookie,
  destroySessionCookie,
  requireSession,
  verifyCredentials,
} from "@/lib/auth";

// SOT:auth-actions
// WHAT: Login + logout server actions with throttling.
// WHY:  Credential check and session cookie handling must stay server-side.
// HOW:  LoginForm calls loginAction; nav logout button calls logoutAction.
// WHERE: /login page and authenticated layout.

const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required").max(64),
  password: z.string().min(1, "Password is required").max(128),
});

export type LoginState = { ok: true } | { ok: false; error: string };

// NOTE (S16/O3): in-memory sliding window. On serverless each instance keeps
// its own counters, so this raises the bar but is not a hard global limit.
// Accepted for a single-user internal MVP; revisit if exposure changes.
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

async function clientKey(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

function isThrottled(key: string): boolean {
  const entry = attempts.get(key);
  if (!entry) return false;
  if (Date.now() > entry.resetAt) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Enter your username and password." };
  }

  const key = await clientKey();
  if (isThrottled(key)) {
    return {
      ok: false,
      error: "Too many attempts. Try again in a few minutes.",
    };
  }

  const valid = await verifyCredentials(parsed.data.username, parsed.data.password);
  if (!valid) {
    recordFailure(key);
    return { ok: false, error: "Invalid username or password." };
  }
  attempts.delete(key);
  await createSessionCookie(parsed.data.username);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await requireSession();
  await destroySessionCookie();
  redirect("/login");
}
