// プロ・ベンチマーク・アナリティクス
// 記録済みスタッツから、ポジション別の主要指標を算出し、
// プロ（Vリーグ/日本代表）の参考値と比較する。
//
// 注: ベンチマーク値は公開統計に基づく概算の「参考値」であり、
// クラウド同期の公式リアルタイムデータではありません。
import {
  attackEfficiency,
  killRate,
  receptionARate,
  receptionRate,
  type PlayerStats,
} from "./stats";
import type { Position } from "./types";

export interface Benchmark {
  key: string;
  label: string;
  unit: "%" | "本";
  /** プレーヤー値（nullなら試行なし）。 */
  value: (p: PlayerStats) => number | null;
  /** メーターの最大値。count系は動的に拡張。 */
  max: number;
  isCount?: boolean;
  vLeague?: number; // Vリーグ平均（参考）
  national?: number; // 代表トップ（参考）
  /** 比較フィードバック。 */
  advice: (v: number | null) => string;
}

const serveAce = (p: PlayerStats) =>
  p.serve.total ? (p.serve.ace / p.serve.total) * 100 : null;
const serveErr = (p: PlayerStats) =>
  p.serve.total ? (p.serve.error / p.serve.total) * 100 : null;

const POOL: Record<string, Benchmark> = {
  killRate: {
    key: "killRate",
    label: "スパイク決定率",
    unit: "%",
    value: killRate,
    max: 70,
    vLeague: 50,
    national: 58,
    advice: (v) =>
      v == null
        ? "スパイクの記録がありません。"
        : v >= 58
          ? "代表トップ級！この決定力を維持しよう。"
          : v >= 50
            ? "Vリーグ平均超え。あと一歩で代表トップ。"
            : "まずVリーグ平均50%へ。helping手やコース打ちを磨こう。",
  },
  attackEff: {
    key: "attackEff",
    label: "スパイク効果率",
    unit: "%",
    value: attackEfficiency,
    max: 60,
    vLeague: 25,
    national: 35,
    advice: (v) =>
      v == null
        ? "スパイクの記録がありません。"
        : v >= 35
          ? "効果率が非常に高い。ミス・被ブロックが少ない証拠。"
          : v >= 25
            ? "Vリーグ平均水準。被ブロックを減らせば代表級。"
            : "ミスと被ブロックを減らそう（ブロックアウト/リバウンド活用）。",
  },
  serveAce: {
    key: "serveAce",
    label: "サービスエース率",
    unit: "%",
    value: serveAce,
    max: 20,
    vLeague: 6,
    national: 10,
    advice: (v) =>
      v == null
        ? "サーブの記録がありません。"
        : v >= 10
          ? "エース率が代表級。攻撃的サーブが武器。"
          : v >= 6
            ? "Vリーグ平均超え。コースを突き続けよう。"
            : "スピードを上げるかコースを狙ってエース率6%を目指そう。",
  },
  serveErr: {
    key: "serveErr",
    label: "サーブミス率（低いほど良）",
    unit: "%",
    value: serveErr,
    max: 30,
    vLeague: 12,
    national: 9,
    advice: (v) =>
      v == null
        ? "サーブの記録がありません。"
        : v <= 9
          ? "ミスが非常に少ない。安定感は代表級。"
          : v <= 12
            ? "Vリーグ平均水準。攻めとのバランス良好。"
            : "ミスが多め。まず確実に入れる本数を増やそう。",
  },
  recvA: {
    key: "recvA",
    label: "レセプション好返球率(A)",
    unit: "%",
    value: receptionARate,
    max: 80,
    vLeague: 40,
    national: 55,
    advice: (v) =>
      v == null
        ? "レセプションの記録がありません。"
        : v >= 55
          ? "Aパス率が代表級。速い攻撃に繋げられる。"
          : v >= 40
            ? "Vリーグ平均水準。さらにAパスを増やそう。"
            : "返球の質を上げてAパス率40%へ。",
  },
  recvReturn: {
    key: "recvReturn",
    label: "サーブレシーブ返球率",
    unit: "%",
    value: receptionRate,
    max: 100,
    vLeague: 85,
    national: 92,
    advice: (v) =>
      v == null
        ? "レセプションの記録がありません。"
        : v >= 92
          ? "返球率が代表級。崩されない守備。"
          : v >= 85
            ? "Vリーグ平均水準。"
            : "まず返球率85%（崩れ・失点を減らす）へ。",
  },
  blockKill: {
    key: "blockKill",
    label: "ブロック決定数",
    unit: "本",
    isCount: true,
    value: (p) => p.block.kill || null,
    max: 10,
    advice: (v) => (v ? `${v}本のシャットアウト。壁として機能中。` : "ブロック決定を積み上げよう。"),
  },
  setAssist: {
    key: "setAssist",
    label: "トス・アシスト数",
    unit: "本",
    isCount: true,
    value: (p) => p.set.assist || null,
    max: 20,
    advice: (v) => (v ? `${v}本のアシスト。配球の軸。` : "アシストを記録して配球を可視化しよう。"),
  },
  digUp: {
    key: "digUp",
    label: "ディグ成功数",
    unit: "本",
    isCount: true,
    value: (p) => p.dig.up || null,
    max: 20,
    advice: (v) => (v ? `${v}本のディグ成功。粘りの守備。` : "ディグ成功を積み上げよう。"),
  },
};

const POSITION_METRICS: Record<Position, string[]> = {
  OH: ["killRate", "attackEff", "recvA", "serveAce"],
  OP: ["killRate", "attackEff", "serveAce", "serveErr"],
  MB: ["blockKill", "killRate", "attackEff"],
  S: ["setAssist", "serveAce", "digUp"],
  L: ["recvA", "recvReturn", "digUp"],
  DS: ["recvA", "digUp", "recvReturn"],
};

/** 全ポジション共通で表示する追加指標（重複は除外）。 */
const COMMON = ["serveAce"];

export function benchmarksForPosition(position: Position | null | undefined): Benchmark[] {
  const keys = position ? POSITION_METRICS[position] : ["killRate", "attackEff", "serveAce", "recvReturn"];
  const merged = [...keys];
  for (const c of COMMON) if (!merged.includes(c)) merged.push(c);
  return merged.map((k) => POOL[k]).filter(Boolean);
}
