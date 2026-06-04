// Firestore data-access helpers. Keeps collection paths and shapes in one place.
import {
  addDoc,
  arrayRemove,
  arrayUnion,
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
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "./config";
import type {
  FeatureRequest,
  Goal,
  GoalStatus,
  GrowthVideo,
  JournalEntry,
  Match,
  Practice,
  RequestStatus,
  Role,
  Tactic,
  Team,
  VideoComment,
} from "@/lib/types";
import type { Skill, StatEvent } from "@/lib/stats";

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

// ---- Feature requests / sharing board ----------------------------------

export async function createRequest(
  data: Omit<FeatureRequest, "id" | "createdAt">,
): Promise<string> {
  const ref = await addDoc(collection(db, "requests"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Toggle the current user's upvote on a request. */
export async function toggleVote(
  id: string,
  uid: string,
  hasVoted: boolean,
): Promise<void> {
  await updateDoc(doc(db, "requests", id), {
    voters: hasVoted ? arrayRemove(uid) : arrayUnion(uid),
  });
}

export async function setRequestStatus(
  id: string,
  status: RequestStatus,
): Promise<void> {
  await updateDoc(doc(db, "requests", id), { status });
}

export async function deleteRequest(id: string): Promise<void> {
  await deleteDoc(doc(db, "requests", id));
}

export function requestsQuery(teamId: string) {
  return query(
    collection(db, "requests"),
    where("teamId", "==", teamId),
    orderBy("createdAt", "desc"),
  );
}

// ---- Matches & stats (機能②) -------------------------------------------

export async function createMatch(
  data: Omit<Match, "id" | "createdAt">,
): Promise<string> {
  const ref = await addDoc(collection(db, "matches"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateMatch(
  id: string,
  data: Partial<Omit<Match, "id" | "teamId">>,
): Promise<void> {
  await updateDoc(doc(db, "matches", id), data);
}

export async function deleteMatch(id: string): Promise<void> {
  await deleteDoc(doc(db, "matches", id));
}

export function matchesQuery(teamId: string) {
  // Single-field filter (auto-indexed); ordering is done client-side.
  return query(collection(db, "matches"), where("teamId", "==", teamId));
}

/** Record one stat event (the result of a 3-tap entry). */
export async function recordStat(data: {
  teamId: string;
  matchId: string;
  set: number;
  playerId: string;
  playerName: string;
  jersey: number | null;
  skill: Skill;
  result: string;
}): Promise<void> {
  await addDoc(collection(db, "stats"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function deleteStat(id: string): Promise<void> {
  await deleteDoc(doc(db, "stats", id));
}

/** Events for a single match (sorted client-side). */
export function matchStatsQuery(matchId: string) {
  return query(collection(db, "stats"), where("matchId", "==", matchId));
}

/** All events for a team, for the cumulative leaderboard. */
export function teamStatsQuery(teamId: string) {
  return query(collection(db, "stats"), where("teamId", "==", teamId));
}

export type { StatEvent };

// ---- Portfolio: skill sheets (機能③) -----------------------------------

/** Set one self/coach rating. Doc id is the member's uid; maps deep-merge. */
export async function setRating(
  userId: string,
  teamId: string,
  side: "self" | "coach",
  skillKey: string,
  value: number,
): Promise<void> {
  await setDoc(
    doc(db, "skillSheets", userId),
    {
      teamId,
      userId,
      [side]: { [skillKey]: value },
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

// ---- Portfolio: growth videos ------------------------------------------

/** Upload a video file to Storage; returns its public URL + path. */
export async function uploadVideo(
  file: File,
  teamId: string,
  userId: string,
): Promise<{ url: string; path: string }> {
  const safe = file.name.replace(/[^\w.-]/g, "_");
  const path = `videos/${teamId}/${userId}/${Date.now()}_${safe}`;
  const r = storageRef(storage, path);
  await uploadBytes(r, file);
  const url = await getDownloadURL(r);
  return { url, path };
}

export async function createVideo(
  data: Omit<GrowthVideo, "id" | "createdAt">,
): Promise<string> {
  const ref = await addDoc(collection(db, "videos"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function addVideoComment(
  videoId: string,
  comment: VideoComment,
): Promise<void> {
  await updateDoc(doc(db, "videos", videoId), {
    comments: arrayUnion(comment),
  });
}

export async function deleteVideo(video: GrowthVideo): Promise<void> {
  await deleteDoc(doc(db, "videos", video.id));
  if (video.storagePath) {
    try {
      await deleteObject(storageRef(storage, video.storagePath));
    } catch {
      // file may already be gone — ignore
    }
  }
}

export function videosByUserQuery(userId: string) {
  return query(collection(db, "videos"), where("userId", "==", userId));
}

// ---- Portfolio: goals (PDCA) -------------------------------------------

export async function createGoal(
  data: Omit<Goal, "id" | "createdAt">,
): Promise<string> {
  const ref = await addDoc(collection(db, "goals"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateGoal(
  id: string,
  data: Partial<Omit<Goal, "id" | "teamId" | "userId">>,
): Promise<void> {
  await updateDoc(doc(db, "goals", id), data);
}

export async function setGoalStatus(id: string, status: GoalStatus): Promise<void> {
  await updateDoc(doc(db, "goals", id), { status });
}

export async function deleteGoal(id: string): Promise<void> {
  await deleteDoc(doc(db, "goals", id));
}

export function goalsByUserQuery(userId: string) {
  return query(collection(db, "goals"), where("userId", "==", userId));
}
