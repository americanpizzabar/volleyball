import "server-only";
import { createNeonAuth } from "@neondatabase/auth/next/server";

// Neon Auth (powered by Better Auth). The base URL is shown in the Neon project's
// Auth tab; the cookie secret is your own random 32+ char string. Placeholder
// fallbacks keep module imports and the build working before the integration is
// connected — requests then fail only at runtime, never at import time.
// (createNeonAuth throws synchronously if the secret is shorter than 32 chars,
// so the placeholder below is deliberately long enough.)
export const isAuthConfigured = Boolean(
  process.env.NEON_AUTH_BASE_URL && process.env.NEON_AUTH_COOKIE_SECRET,
);

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL || "https://placeholder.neonauth.invalid",
  cookies: {
    secret:
      process.env.NEON_AUTH_COOKIE_SECRET ||
      "neon_auth_placeholder_cookie_secret_change_me_0123456789",
  },
});
