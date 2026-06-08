// DataVolley 互換のスカウティングコードを、アプリのタップ/なぞる入力から自動生成する。
// 形式（簡易）: <チーム><背番号2桁><スキル><評価>[ゾーン]
//   チーム: * = 自チーム
//   スキル: S=サーブ R=レセプション A=アタック B=ブロック D=ディグ E=セット
//   評価:   # =決定/完璧, + =良, ! =可, - =不良, / =被ブロック/オーバーパス, = =ミス
import type { StatEvent } from "./stats";

const SKILL_CODE: Record<string, string> = {
  serve: "S",
  reception: "R",
  spike: "A",
  block: "B",
  dig: "D",
  set: "E",
};

function evalCode(skill: string, result: string): string {
  switch (skill) {
    case "spike":
      return result === "kill" ? "#" : result === "blocked" ? "/" : result === "error" ? "=" : "-";
    case "serve":
      return result === "ace" ? "#" : result === "error" ? "=" : "+";
    case "block":
      return result === "kill" ? "#" : result === "touch" ? "!" : "=";
    case "reception":
      return result === "a" ? "#" : result === "b" ? "+" : result === "c" ? "!" : "=";
    case "dig":
      return result === "up" ? "+" : "=";
    case "set":
      return result === "assist" ? "+" : "=";
    default:
      return "+";
  }
}

/** 相手コートの着地点(0-100,0-100) → ゾーン番号(1-6 + 前後)。簡易マッピング。 */
function zoneOf(x: number, y: number): string {
  // x: 0(左)-100(右), y: 0(ネット側)-100(奥)
  const col = x < 33 ? 0 : x < 66 ? 1 : 2; // 左/中/右
  const front = y < 50; // 前衛ゾーン側
  // 前衛: 左4 中3 右2 / 後衛: 左5 中6 右1
  const zones = front ? [4, 3, 2] : [5, 6, 1];
  return `~${zones[col]}`;
}

/** 1イベント → DataVolley互換コード文字列。 */
export function toDataVolleyCode(e: StatEvent): string {
  const jersey = (e.jersey ?? 0).toString().padStart(2, "0");
  const skill = SKILL_CODE[e.skill] ?? "?";
  const ev = evalCode(e.skill, e.result);
  const zone = e.skill === "spike" && e.x != null && e.y != null ? zoneOf(e.x, e.y) : "";
  return `*${jersey}${skill}${ev}${zone}`;
}

/** 試合の全イベント → .dvw 風テキスト（エクスポート用）。 */
export function toDataVolleyText(events: StatEvent[], header: string): string {
  const sorted = [...events].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
  const lines = sorted.map((e) => {
    const t = e.createdAt ? new Date(e.createdAt).toISOString() : "";
    return `${toDataVolleyCode(e)}\t set${e.set}\t ${e.playerName}\t ${t}`;
  });
  return `[3SCOUT]\n; ${header}\n; code\tset\tplayer\ttime\n${lines.join("\n")}\n`;
}
