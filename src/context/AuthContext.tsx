"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authClient } from "@/lib/auth/client";
import { getOrCreateProfile, loadTeam, getAuthConfigured } from "@/lib/server/actions";
import type { Team, UserProfile } from "@/lib/types";

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  profile: UserProfile | null;
  team: Team | null;
  loading: boolean;
  configured: boolean;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<{ needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function errMessage(e: unknown, fallback: string): string {
  if (e && typeof e === "object" && "message" in e) {
    return String((e as { message: unknown }).message) || fallback;
  }
  return fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Better Auth reactive session (nanostore-backed; safe during SSR — no suspend).
  const { data: session, isPending } = authClient.useSession();
  const sessionUser = session?.user ?? null;
  const uid = sessionUser?.id ?? null;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [configured, setConfigured] = useState(true);

  const user = useMemo<AuthUser | null>(
    () => (sessionUser ? { id: sessionUser.id, email: sessionUser.email ?? "" } : null),
    [sessionUser],
  );

  // Probe (once) whether the Neon Auth env vars are wired up.
  useEffect(() => {
    getAuthConfigured()
      .then(setConfigured)
      .catch(() => setConfigured(false));
  }, []);

  // Load (or lazily create) the profile row whenever the signed-in user changes.
  useEffect(() => {
    if (isPending) return; // wait for the session to settle first
    let cancelled = false;
    if (!uid) {
      setProfile(null);
      setTeam(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    getOrCreateProfile()
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        setProfileLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setProfile(null);
        setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uid, isPending]);

  // Load the user's team whenever the team id changes.
  useEffect(() => {
    const teamId = profile?.teamId;
    if (!teamId) {
      setTeam(null);
      return;
    }
    let cancelled = false;
    loadTeam(teamId).then((t) => {
      if (!cancelled) setTeam(t);
    });
    return () => {
      cancelled = true;
    };
  }, [profile?.teamId]);

  const loading = isPending || profileLoading;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      team,
      loading,
      configured,
      async signUp(email, password, displayName) {
        const res = await authClient.signUp.email({ email, password, name: displayName });
        if (res.error) throw new Error(errMessage(res.error, "登録に失敗しました。"));
        // Persist the chosen display name to our profiles table.
        try {
          await getOrCreateProfile(displayName);
        } catch {
          /* profile is also created lazily on first load */
        }
        return { needsConfirmation: false };
      },
      async signIn(email, password) {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) throw new Error(errMessage(res.error, "ログインに失敗しました。"));
      },
      async sendPasswordReset(email) {
        const redirectTo =
          typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
        const res = await authClient.requestPasswordReset({ email, redirectTo });
        if (res.error) throw new Error(errMessage(res.error, "送信に失敗しました。"));
      },
      async updatePassword(oldPassword, newPassword) {
        const res = await authClient.changePassword({
          currentPassword: oldPassword,
          newPassword,
        });
        if (res.error) throw new Error(errMessage(res.error, "変更に失敗しました。"));
      },
      async logout() {
        await authClient.signOut();
      },
    }),
    [user, profile, team, loading, configured],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
