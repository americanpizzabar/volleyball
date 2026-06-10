import "server-only";
import { neon } from "@neondatabase/serverless";
import { stackServerApp } from "@/stack/server";

// Neon serverless (HTTP) driver. DATABASE_URL is provided by the Neon ↔ Vercel
// integration. A syntactically-valid placeholder keeps the build working before
// the database is connected (queries only fail at runtime, never at import).
export const isNeonConfigured = Boolean(process.env.DATABASE_URL);

const connectionString =
  process.env.DATABASE_URL || "postgresql://demo:demo@demo.neon.tech/demo?sslmode=require";

export const sql = neon(connectionString);

/** The Stack Auth user id of the current request, or null when signed out. */
export async function currentUserId(): Promise<string | null> {
  try {
    const user = await stackServerApp.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

/** The full Stack Auth user (for email / display name on first sign-in). */
export async function currentStackUser() {
  try {
    return await stackServerApp.getUser();
  } catch {
    return null;
  }
}
