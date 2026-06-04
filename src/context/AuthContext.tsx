"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase/config";
import type { Team, UserProfile } from "@/lib/types";

interface AuthContextValue {
  /** Firebase auth user, or null when signed out. */
  user: User | null;
  /** Firestore profile doc, or null while loading / before it exists. */
  profile: UserProfile | null;
  /** The team the user belongs to, or null. */
  team: Team | null;
  /** True until the initial auth + profile state has resolved. */
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

  // Track auth state.
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setTeam(null);
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  // Subscribe to the user's profile document.
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [user]);

  // Subscribe to the user's team document.
  useEffect(() => {
    const teamId = profile?.teamId;
    if (!teamId) {
      setTeam(null);
      return;
    }
    const ref = doc(db, "teams", teamId);
    const unsub = onSnapshot(ref, (snap) => {
      setTeam(snap.exists() ? ({ id: snap.id, ...snap.data() } as Team) : null);
    });
    return unsub;
  }, [profile?.teamId]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      team,
      loading,
      configured: isFirebaseConfigured,
      async signUp(email, password, displayName) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName });
        // Create the profile doc with no team yet → user goes to onboarding.
        await setDoc(doc(db, "users", cred.user.uid), {
          uid: cred.user.uid,
          email,
          displayName,
          role: "player",
          teamId: null,
          createdAt: serverTimestamp(),
        });
      },
      async signIn(email, password) {
        await signInWithEmailAndPassword(auth, email, password);
      },
      async logout() {
        await signOut(auth);
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
