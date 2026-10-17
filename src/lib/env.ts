import { z } from "zod";

// SOT:env
// WHAT: Validated, typed access to server environment variables.
// WHY:  Fail fast with a clear message instead of cryptic undefined behavior.
// HOW:  Imported by server code only (auth, services, route handlers).
// WHERE: Never imported by client components — values include secrets.

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  APP_USERNAME: z.string().min(1, "APP_USERNAME is required"),
  APP_PASSWORD_HASH: z.string().min(1, "APP_PASSWORD_HASH is required"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be 32+ chars"),
  FRAPPE_UPLOAD_URL: z.string().url("FRAPPE_UPLOAD_URL must be a URL"),
  FRAPPE_API_KEY: z.string().min(1, "FRAPPE_API_KEY is required"),
  FRAPPE_API_SECRET: z.string().min(1, "FRAPPE_API_SECRET is required"),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
