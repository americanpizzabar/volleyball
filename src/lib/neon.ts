import "server-only";
import { neon } from "@neondatabase/serverless";
import { auth } from "@/lib/auth/server";

// Neon serverless (HTTP) driver. DATABASE_URL is provided by the Neon ↔ Vercel
// integration. A syntactically-valid placeholder keeps the build working before
// the database is connected (queries only fail at runtime, never at import).
export const isNeonConfigured = Boolean(process.env.DATABASE_URL);

const connectionString =
  process.env.DATABASE_URL || "postgresql://demo:demo@demo.neon.tech/demo?sslmode=require";

export const sql = neon(connectionString);

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

/** The Better Auth session user for the current request, or null when signed out. */
async function sessionUser(): Promise<AuthUser | null> {
  try {
    const { data } = await auth.getSession();
    const u = data?.user;
    if (!u) return null;
    return { id: u.id, email: u.email ?? "", name: u.name ?? "" };
  } catch {
    return null;
  }
}

/** The Neon Auth user id of the current request, or null when signed out. */
export async function currentUserId(): Promise<string | null> {
  return (await sessionUser())?.id ?? null;
}

/** The full Neon Auth user (for email / display name on first sign-in). */
export async function currentAuthUser(): Promise<AuthUser | null> {
  return sessionUser();
}
