import "server-only";
import { createNeonAuth } from "@neondatabase/auth/next/server";

// Neon Auth (powered by Better Auth). The base URL is shown in the Neon project's
// Auth tab; the cookie secret is your own random 32+ char string.
//
// IMPORTANT: createNeonAuth throws synchronously if the secret is shorter than 32
// characters, and Next.js evaluates this module during `next build`. To make the
// build resilient to a misconfigured env var, we only pass a user-provided secret
// when it is long enough — otherwise we fall back to a safe placeholder and report
// the integration as "not configured" (the app then shows the setup notice rather
// than failing the build).
const PLACEHOLDER_SECRET = "neon_auth_placeholder_cookie_secret_change_me_0123456789";
const rawSecret = process.env.NEON_AUTH_COOKIE_SECRET ?? "";
const hasValidSecret = rawSecret.length >= 32;

export const isAuthConfigured = Boolean(process.env.NEON_AUTH_BASE_URL) && hasValidSecret;

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL || "https://placeholder.neonauth.invalid",
  cookies: {
    secret: hasValidSecret ? rawSecret : PLACEHOLDER_SECRET,
  },
});
