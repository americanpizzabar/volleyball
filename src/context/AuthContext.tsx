"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { mapProfile, mapTeam } from "@/lib/db";
import type { Team, UserProfile } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  team: Team | null;
  loading: boolean;
  configured: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  // Track the auth session.
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      if (!data.session) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        setProfile(null);
        setTeam(null);
        setLoading(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Load + subscribe to the user's profile row.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function loadProfile() {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (cancelled) return;
      setProfile(data ? mapProfile(data) : null);
      setLoading(false);
    }
    loadProfile();

    const channel = supabase
      .channel(`rt:profile:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        () => loadProfile(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Load the user's team whenever the team id changes.
  useEffect(() => {
    const teamId = profile?.teamId;
    if (!teamId) {
      setTeam(null);
      return;
    }
    let cancelled = false;
    supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setTeam(data ? mapTeam(data) : null);
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
      configured: isSupabaseConfigured,
      async signUp(email, password, displayName) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        if (error) throw error;
        // profiles row is created by the on_auth_user_created trigger.
      },
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async logout() {
        await supabase.auth.signOut();
      },
    }),
    [user, profile, team, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
