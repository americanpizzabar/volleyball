// Supabase browser client.
// URL + anon/publishable key are PUBLIC values (shipped to the browser).
// Security is enforced by Row Level Security (RLS) policies, not by hiding them.
// Copy .env.local.example to .env.local and fill in your project's values.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://demo.supabase.co";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "demo-anon-key";

/** True when real env vars are present so the UI can show a setup hint. */
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export const supabase: SupabaseClient = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // パスワード再設定/マジックリンクのトークンをURLから検出する
    detectSessionInUrl: true,
  },
});
