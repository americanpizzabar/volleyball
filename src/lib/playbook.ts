// プロ戦術パターンの「お手本」プリセット集（予習用ライブラリ）。
// 既存の TacticViewer（2D/3D・ボール軌道・助走ベクトル）でそのまま再生できる。
// 座標系: x 0(左)-100(右) / y 0(相手エンド)-50(ネット)-100(自エンド)。
import type { Tactic, TacticKeyframe, TacticPlayer, TacticPositions } from "./types";

function kf(name: string, positions: TacticPositions): TacticKeyframe {
  return { id: name, name, positions };
}

// 共通の自チーム6人＋ボール＋相手ブロッカー3枚
const OURS: TacticPlayer[] = [
  { id: "S", label: "S", team: "ours" },
  { id: "O1", label: "OH", team: "ours" },
  { id: "O2", label: "OH", team: "ours" },
  { id: "M1", label: "MB", team: "ours" },
  { id: "M2", label: "MB", team: "ours" },
  { id: "P", label: "OP", team: "ours" },
];
const BLOCKERS: TacticPlayer[] = [
  { id: "b1", label: "B", team: "theirs" },
  { id: "b2", label: "B", team: "theirs" },
  { id: "b3", label: "B", team: "theirs" },
];
const BALL: TacticPlayer = { id: "ball", label: "●", team: "ball" };

const blockBase = { b1: { x: 22, y: 47 }, b2: { x: 50, y: 47 }, b3: { x: 78, y: 47 } };

export interface PlaybookEntry extends Tactic {
  category: string;
}

function entry(
  id: string,
  category: string,
  title: string,
  description: string,
  rotation: number,
  players: TacticPlayer[],
  keyframes: TacticKeyframe[],
): PlaybookEntry {
  return {
    id,
    category,
    title,
    description,
    rotation,
    players,
    keyframes,
    teamId: "",
    createdBy: "",
  };
}

export const PLAYBOOK: PlaybookEntry[] = [
  // 1. シンクロ攻撃（同時多発）
  entry(
    "synchro",
    "攻撃",
    "シンクロ攻撃（同時多発）",
    "セッターへの返球と同時に全アタッカーが助走を開始。複数枚が同時に跳ぶことで相手ブロックを分散させ、ノーマークを作る。",
    1,
    [...OURS, ...BLOCKERS, BALL],
    [
      kf("レセプション", {
        S: { x: 64, y: 72 }, O1: { x: 16, y: 80 }, O2: { x: 50, y: 90 },
        M1: { x: 44, y: 64 }, M2: { x: 80, y: 82 }, P: { x: 84, y: 72 },
        ...blockBase, ball: { x: 22, y: 78 },
      }),
      kf("セッターへ", {
        S: { x: 56, y: 60 }, O1: { x: 18, y: 70 }, O2: { x: 50, y: 84 },
        M1: { x: 46, y: 60 }, M2: { x: 76, y: 70 }, P: { x: 82, y: 66 },
        ...blockBase, ball: { x: 56, y: 60 },
      }),
      kf("同時多発", {
        S: { x: 58, y: 64 }, O1: { x: 13, y: 57 }, O2: { x: 50, y: 86 },
        M1: { x: 45, y: 55 }, M2: { x: 72, y: 57 }, P: { x: 84, y: 57 },
        ...blockBase, ball: { x: 14, y: 40 },
      }),
    ],
  ),

  // 2. 時間差攻撃（クイック囮＋バックアタック/パイプ）
  entry(
    "tempo",
    "攻撃",
    "時間差・パイプ攻撃",
    "ミドルがAクイックでブロックをひきつけてからのバックアタックOH（パイプ）。テンポ差で相手ブロックの的を外す。",
    1,
    [...OURS, ...BLOCKERS, BALL],
    [
      kf("レセプション", {
        S: { x: 64, y: 72 }, O1: { x: 18, y: 78 }, O2: { x: 50, y: 90 },
        M1: { x: 44, y: 66 }, M2: { x: 80, y: 80 }, P: { x: 84, y: 72 },
        ...blockBase, ball: { x: 48, y: 84 },
      }),
      kf("クイック囮", {
        S: { x: 56, y: 60 }, O1: { x: 18, y: 76 }, O2: { x: 50, y: 78 },
        M1: { x: 47, y: 55 }, M2: { x: 76, y: 70 }, P: { x: 82, y: 66 },
        b1: { x: 30, y: 47 }, b2: { x: 50, y: 46 }, b3: { x: 70, y: 47 }, ball: { x: 56, y: 60 },
      }),
      kf("パイプ決定", {
        S: { x: 58, y: 64 }, O1: { x: 18, y: 74 }, O2: { x: 50, y: 70 },
        M1: { x: 47, y: 56 }, M2: { x: 76, y: 66 }, P: { x: 82, y: 64 },
        b1: { x: 28, y: 47 }, b2: { x: 45, y: 46 }, b3: { x: 62, y: 47 }, ball: { x: 50, y: 41 },
      }),
    ],
  ),

  // 3. ブロード（ミドルの移動攻撃）
  entry(
    "broad",
    "攻撃",
    "ブロード（移動攻撃）",
    "ミドルブロッカーがネットに平行に走りながら打つ移動攻撃。横の動きでブロッカーを置き去りにする。",
    1,
    [...OURS, ...BLOCKERS, BALL],
    [
      kf("セット前", {
        S: { x: 60, y: 60 }, O1: { x: 16, y: 70 }, O2: { x: 50, y: 86 },
        M1: { x: 40, y: 62 }, M2: { x: 80, y: 80 }, P: { x: 84, y: 66 },
        ...blockBase, ball: { x: 60, y: 60 },
      }),
      kf("ミドル走り込み", {
        S: { x: 60, y: 60 }, O1: { x: 16, y: 68 }, O2: { x: 50, y: 84 },
        M1: { x: 64, y: 57 }, M2: { x: 80, y: 76 }, P: { x: 84, y: 64 },
        ...blockBase, ball: { x: 62, y: 58 },
      }),
      kf("ブロード決定", {
        S: { x: 60, y: 62 }, O1: { x: 16, y: 66 }, O2: { x: 50, y: 82 },
        M1: { x: 76, y: 56 }, M2: { x: 82, y: 72 }, P: { x: 84, y: 62 },
        b1: { x: 50, y: 47 }, b2: { x: 66, y: 47 }, b3: { x: 80, y: 47 }, ball: { x: 80, y: 41 },
      }),
    ],
  ),

  // 4. サーブレシーブ（5人受け → 攻撃展開）
  entry(
    "reception5",
    "守備/レシーブ",
    "サーブレシーブ（5人受け）",
    "前衛ミドルを除く5人でレセプション隊形を組み、Aパスからの速い攻撃に繋げる基本形。返球後の攻撃移行まで。",
    1,
    [...OURS, BALL],
    [
      kf("構え", {
        S: { x: 70, y: 62 }, O1: { x: 20, y: 78 }, O2: { x: 50, y: 92 },
        M1: { x: 45, y: 60 }, M2: { x: 80, y: 80 }, P: { x: 86, y: 70 },
        ball: { x: 50, y: 20 },
      }),
      kf("Aパス返球", {
        S: { x: 58, y: 58 }, O1: { x: 22, y: 76 }, O2: { x: 50, y: 88 },
        M1: { x: 45, y: 60 }, M2: { x: 78, y: 78 }, P: { x: 84, y: 68 },
        ball: { x: 56, y: 58 },
      }),
      kf("攻撃移行", {
        S: { x: 58, y: 60 }, O1: { x: 15, y: 58 }, O2: { x: 50, y: 84 },
        M1: { x: 45, y: 55 }, M2: { x: 74, y: 66 }, P: { x: 84, y: 58 },
        ball: { x: 56, y: 58 },
      }),
    ],
  ),

  // 5. リードブロック（相手レフトへ3枚移動）
  entry(
    "readblock",
    "守備/ブロック",
    "リードブロック移動",
    "相手セッターのトスを見てから、ミドルがサイドへ移動して2枚〜3枚ブロックを形成。コミットせず“見て跳ぶ”守備の基本。",
    1,
    [
      { id: "M1", label: "MB", team: "ours" },
      { id: "O1", label: "OH", team: "ours" },
      { id: "P", label: "OP", team: "ours" },
      BALL,
    ],
    [
      kf("セット待ち", {
        M1: { x: 50, y: 47 }, O1: { x: 20, y: 47 }, P: { x: 80, y: 47 },
        ball: { x: 60, y: 38 },
      }),
      kf("トス判断", {
        M1: { x: 38, y: 47 }, O1: { x: 20, y: 47 }, P: { x: 78, y: 48 },
        ball: { x: 30, y: 30 },
      }),
      kf("2枚ブロック完成", {
        M1: { x: 26, y: 47 }, O1: { x: 16, y: 47 }, P: { x: 76, y: 48 },
        ball: { x: 18, y: 25 },
      }),
    ],
  ),
];

export function getPlaybookEntry(id: string): PlaybookEntry | undefined {
  return PLAYBOOK.find((p) => p.id === id);
}
