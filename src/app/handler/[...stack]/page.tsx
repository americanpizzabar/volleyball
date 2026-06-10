import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "@/stack/server";

// Stack Auth's built-in pages (email verification, password reset callback,
// OAuth callbacks). Our custom /login, /signup, /forgot-password drive the
// credential flows; this catch-all handles the rest.
export const dynamic = "force-dynamic";

export default function Handler(props: { params: unknown; searchParams: unknown }) {
  return <StackHandler fullPage app={stackServerApp} routeProps={props} />;
}
