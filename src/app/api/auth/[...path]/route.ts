import { auth } from "@/lib/auth/server";

// Same-origin proxy for Neon Auth (Better Auth). The browser client posts to
// /api/auth/* and this handler forwards the requests to the Neon Auth server,
// rewriting cookies so the session stays first-party on the app's domain.
export const dynamic = "force-dynamic";

export const { GET, POST } = auth.handler();
