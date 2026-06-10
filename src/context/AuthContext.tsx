"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useStackApp, useUser } from "@stackframe/stack";
import { getOrCreateProfile, loadTeam } from "@/lib/server/actions";
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
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const app = useStackApp();
  const stackUser = useUser();
  const uid = stackUser?.id ?? null;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  const user = useMemo<AuthUser | null>(
    () => (stackUser ? { id: stackUser.id, email: stackUser.primaryEmail ?? "" } : null),
    [stackUser],
  );

  // Load (or lazily create) the profile row whenever the signed-in user changes.
  useEffect(() => {
    let cancelled = false;
    if (!uid) {
      setProfile(null);
      setTeam(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    getOrCreateProfile()
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setProfile(null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

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

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      team,
      loading,
      configured: Boolean(process.env.NEXT_PUBLIC_STACK_PROJECT_ID),
      async signUp(email, password, displayName) {
        const res = await app.signUpWithCredential({ email, password, noRedirect: true });
        if (res.status === "error") throw new Error(errMessage(res.error, "登録に失敗しました。"));
        // Persist the chosen display name to our profiles table.
        try {
          await getOrCreateProfile(displayName);
        } catch {
          /* profile is also created lazily on first load */
        }
        return { needsConfirmation: false };
      },
      async signIn(email, password) {
        const res = await app.signInWithCredential({ email, password, noRedirect: true });
        if (res.status === "error") throw new Error(errMessage(res.error, "ログインに失敗しました。"));
      },
      async sendPasswordReset(email) {
        const res = await app.sendForgotPasswordEmail(email);
        if (res.status === "error") throw new Error(errMessage(res.error, "送信に失敗しました。"));
      },
      async updatePassword(oldPassword, newPassword) {
        if (!stackUser) throw new Error("ログインが必要です。");
        const err = await stackUser.updatePassword({ oldPassword, newPassword });
        if (err) throw new Error(errMessage(err, "変更に失敗しました。"));
      },
      async logout() {
        await stackUser?.signOut();
      },
    }),
    [user, profile, team, loading, app, stackUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
