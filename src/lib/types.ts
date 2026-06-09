// Shared domain types for the volleyball club app (バレー部アプリ).

export type Role = "coach" | "player" | "manager";

export const ROLE_LABELS: Record<Role, string> = {
  coach: "顧問・コーチ",
  player: "部員",
  manager: "マネージャー",
};

/** Volleyball positions used for skill sheets and player profiles. */
export type Position = "OH" | "OP" | "MB" | "S" | "L" | "DS";

export const POSITION_LABELS: Record<Position, string> = {
  OH: "アウトサイドヒッター (レフト)",
  OP: "オポジット (ライト)",
  MB: "ミドルブロッカー (センター)",
  S: "セッター",
  L: "リベロ",
  DS: "ディフェンススペシャリスト",
};

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  teamId: string | null;
  jerseyNumber?: number | null;
  position?: Position | null;
  squad?: "A" | "B" | null;
  createdAt?: number;
}

export interface Team {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  createdAt?: number;
}

/** A scheduled / past practice with its theme and intent (今日のメニューと意図). */
export interface Practice {
  id: string;
  teamId: string;
  date: string; // YYYY-MM-DD
  title: string;
  theme: string; // 今日のテーマ
  intent: string; // 意図・ねらい
  menu: string; // 練習メニュー (自由記述)
  tacticIds: string[]; // linked tactic boards (配置図/ローテ)
  createdBy: string;
  createdAt?: number;
}

/** A token on the tactic board. */
export interface TacticPlayer {
  id: string;
  label: string; // e.g. "S", "4", "MB"
  team: "ours" | "theirs" | "ball";
}

/** Position of every token at a single moment. Keyed by TacticPlayer.id. */
export type TacticPositions = Record<string, { x: number; y: number }>;

/** One step of the animation (e.g. "サーブ時", "レセプション後"). */
export interface TacticKeyframe {
  id: string;
  name: string;
  positions: TacticPositions;
}

/** A reusable tactic board / animated rotation (アニメーション付きローテ). */
export interface Tactic {
  id: string;
  teamId: string;
  title: string;
  description: string;
  rotation: number; // 1-6, which rotation this represents
  players: TacticPlayer[];
  keyframes: TacticKeyframe[];
  createdBy: string;
  createdAt?: number;
}

/** A player's reflection on a practice (振り返りコメント / 日誌). */
export interface JournalEntry {
  id: string;
  teamId: string;
  practiceId: string | null;
  practiceTitle: string;
  authorId: string;
  authorName: string;
  condition: number; // 1-5 自己コンディション
  content: string;
  createdAt?: number;
}

/** Category for the request / sharing board (機能④). */
export type RequestCategory = "feature" | "share" | "other";

export const REQUEST_CATEGORY_LABELS: Record<RequestCategory, string> = {
  feature: "機能リクエスト",
  share: "情報共有",
  other: "その他",
};

export type RequestStatus = "open" | "planned" | "done";

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  open: "受付中",
  planned: "対応予定",
  done: "対応済み",
};

/** A request/idea that members can post and upvote (要望・投票). */
export interface FeatureRequest {
  id: string;
  teamId: string;
  title: string;
  description: string;
  category: RequestCategory;
  status: RequestStatus;
  authorId: string;
  authorName: string;
  voters: string[]; // uids who upvoted
  createdAt?: number;
}

/** A match whose stats are being recorded (機能②). */
export interface Match {
  id: string;
  teamId: string;
  opponent: string;
  date: string; // YYYY-MM-DD
  tournament: string; // 大会名 (任意)
  status: "live" | "finished";
  currentSet: number; // 1-5
  sets: { us: number; them: number }[]; // index 0 = 第1セット
  createdBy: string;
  createdAt?: number;
}

/** Per-member skill-check sheet (機能③ ポジション別スキルチェック). */
export interface SkillSheet {
  id: string; // = userId
  teamId: string;
  userId: string;
  self: Record<string, number>; // skillKey -> 1..5 (本人)
  coach: Record<string, number>; // skillKey -> 1..5 (指導者)
  updatedAt?: number;
}

export interface VideoComment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  at: number;
}

/** Growth-record video (機能③ 動画付き成長記録). */
export interface GrowthVideo {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  title: string;
  skillTag: string; // 自由タグ（例: サーブフォーム）
  url: string;
  storagePath: string;
  comments: VideoComment[]; // 顧問からのワンポイント等
  createdAt?: number;
}

/** 栄養クエストの食事ログ（機能：マッスル・モンスター・バトル）。 */
export interface NutritionLog {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  tags: string[];
  power: number;
  combo: string;
  createdAt?: number;
}

/** ガチャの抽選履歴。 */
export interface GachaPull {
  id: string;
  teamId: string;
  userId: string;
  rewardKey: string;
  rarity: string;
  createdAt?: number;
}

export type GoalStatus = "active" | "done" | "dropped";

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  active: "挑戦中",
  done: "達成",
  dropped: "見直し",
};

/** Personal goal with PDCA (機能③ 目標設定). */
export interface Goal {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  title: string; // 目標 (Plan)
  metric: string; // 達成基準・指標
  practiceIds: string[]; // 紐づく練習メニュー (Do)
  dueDate: string; // 期限 YYYY-MM-DD
  reflection: string; // 振り返り (Check)
  status: GoalStatus; // (Act)
  createdAt?: number;
}
