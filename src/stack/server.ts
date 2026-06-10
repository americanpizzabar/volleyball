import "server-only";
import { StackServerApp } from "@stackframe/stack";

// Neon Auth (powered by Stack Auth). Project id + keys come from the Neon Auth
// configuration that you wire up in the Vercel/Neon dashboard. They are exposed
// to Vercel as env vars (see .env.local.example). Fallback dummy values keep the
// build working before the integration is connected.
export const isStackConfigured = Boolean(
  process.env.NEXT_PUBLIC_STACK_PROJECT_ID && process.env.STACK_SECRET_SERVER_KEY,
);

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID || "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  publishableClientKey:
    process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || "pck_demo_placeholder",
  secretServerKey: process.env.STACK_SECRET_SERVER_KEY || "ssk_demo_placeholder",
  urls: {
    signIn: "/login",
    signUp: "/signup",
    afterSignIn: "/app",
    afterSignUp: "/onboarding",
    afterSignOut: "/",
    forgotPassword: "/forgot-password",
  },
});
