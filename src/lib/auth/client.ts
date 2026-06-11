"use client";

import { createAuthClient } from "@neondatabase/auth/next";

// Browser-side Neon Auth (Better Auth) client. With no arguments it talks to the
// same-origin proxy route at /api/auth/[...path], which forwards to the Neon Auth
// server — keeping session cookies first-party.
export const authClient = createAuthClient();
