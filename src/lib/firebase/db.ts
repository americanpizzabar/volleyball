// Firestore data-access helpers. Keeps collection paths and shapes in one place.
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "./config";
import type {
  JournalEntry,
  Practice,
  Role,
  Tactic,
  Team,
} from "@/lib/types";

function randomInviteCode(): string {
  // 6-char human-friendly code (no ambiguous chars).
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// ---- Teams -------------------------------------------------------------

export async function createTeam(name: string, uid: string): Promise<string> {
  const ref = await addDoc(collection(db, "teams"), {
    name,
    inviteCode: randomInviteCode(),
    createdBy: uid,
    createdAt: serverTimestamp(),
  });
  await setDoc(
    doc(db, "users", uid),
    { teamId: ref.id, role: "coach" satisfies Role },
    { merge: true },
  );
  return ref.id;
}

export async function joinTeamByCode(
  code: string,
  uid: string,
  role: Exclude<Role, "coach">,
): Promise<Team> {
  const snap = await getDocs(
    query(collection(db, "teams"), where("inviteCode", "==", code.toUpperCase()), limit(1)),
  );
  if (snap.empty) throw new Error("その招待コードのチームが見つかりませんでした。");
  const teamDoc = snap.docs[0];
  await setDoc(doc(db, "users", uid), { teamId: teamDoc.id, role }, { merge: true });
  return { id: teamDoc.id, ...teamDoc.data() } as Team;
}

export async function getTeamMembers(teamId: string) {
  const snap = await getDocs(
    query(collection(db, "users"), where("teamId", "==", teamId)),
  );
  return snap.docs.map((d) => d.data());
}

// ---- Practices ---------------------------------------------------------

export async function createPractice(
  data: Omit<Practice, "id" | "createdAt">,
): Promise<string> {
  const ref = await addDoc(collection(db, "practices"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePractice(
  id: string,
  data: Partial<Omit<Practice, "id" | "teamId">>,
): Promise<void> {
  await updateDoc(doc(db, "practices", id), data);
}

export async function deletePractice(id: string): Promise<void> {
  await deleteDoc(doc(db, "practices", id));
}

export async function getPractice(id: string): Promise<Practice | null> {
  const snap = await getDoc(doc(db, "practices", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Practice) : null;
}

export function practicesQuery(teamId: string, ...extra: QueryConstraint[]) {
  return query(
    collection(db, "practices"),
    where("teamId", "==", teamId),
    orderBy("date", "desc"),
    ...extra,
  );
}

// ---- Tactics -----------------------------------------------------------

export async function createTactic(
  data: Omit<Tactic, "id" | "createdAt">,
): Promise<string> {
  const ref = await addDoc(collection(db, "tactics"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTactic(
  id: string,
  data: Partial<Omit<Tactic, "id" | "teamId">>,
): Promise<void> {
  await updateDoc(doc(db, "tactics", id), data);
}

export async function deleteTactic(id: string): Promise<void> {
  await deleteDoc(doc(db, "tactics", id));
}

export async function getTactic(id: string): Promise<Tactic | null> {
  const snap = await getDoc(doc(db, "tactics", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Tactic) : null;
}

export async function getTactics(ids: string[]): Promise<Tactic[]> {
  const results = await Promise.all(ids.map(getTactic));
  return results.filter((t): t is Tactic => t !== null);
}

export function tacticsQuery(teamId: string) {
  return query(
    collection(db, "tactics"),
    where("teamId", "==", teamId),
    orderBy("createdAt", "desc"),
  );
}

// ---- Journals ----------------------------------------------------------

export async function createJournal(
  data: Omit<JournalEntry, "id" | "createdAt">,
): Promise<string> {
  const ref = await addDoc(collection(db, "journals"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteJournal(id: string): Promise<void> {
  await deleteDoc(doc(db, "journals", id));
}

export function journalsQuery(teamId: string) {
  return query(
    collection(db, "journals"),
    where("teamId", "==", teamId),
    orderBy("createdAt", "desc"),
  );
}
