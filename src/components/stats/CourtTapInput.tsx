"use client";

import { useState } from "react";
import TargetCourt from "./TargetCourt";
import type { RosterPlayer } from "./StatRecorder";

const OUTCOMES: { key: string; label: string; color: string }[] = [
  { key: "kill", label: "決定", color: "bg-emerald-500" },
  { key: "error", label: "ミス", color: "bg-red-500" },
  { key: "blocked", label: "被ブロック", color: "bg-orange-500" },
];

/**
 * コートタップ式の2タッチ入力：選手を選ぶ → 落下地点をタップ。
 * 選手と結果は選択が維持されるので、連続入力は1タップで進められる。
 */
export default function CourtTapInput({
  players,
  onRecord,
}: {
  players: RosterPlayer[];
  onRecord: (player: RosterPlayer, result: string, x: number, y: number) => void;
}) {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState("kill");

  const player = players.find((p) => p.id === playerId) ?? null;

  function handleTap(x: number, y: number) {
    if (!player) return;
    onRecord(player, outcome, x, y);
  }

  return (
    <div className="card space-y-3">
      <div>
        <p className="mb-1.5 text-sm font-semibold text-slate-700">① スパイカーを選ぶ</p>
        {players.length === 0 ? (
          <p className="text-sm text-slate-500">背番号を登録した選手がいません。</p>
        ) : (
          <div className="grid grid-cols-6 gap-1.5">
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlayerId(p.id)}
                className={`flex flex-col items-center rounded-xl py-2 ring-1 transition ${
                  playerId === p.id
                    ? "bg-brand-600 text-white ring-brand-600"
                    : "bg-brand-50 text-brand-700 ring-brand-100"
                }`}
              >
                <span className="text-base font-black">{p.jersey ?? "—"}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-1.5 text-sm font-semibold text-slate-700">② 結果</p>
        <div className="grid grid-cols-3 gap-2">
          {OUTCOMES.map((o) => (
            <button
              key={o.key}
              onClick={() => setOutcome(o.key)}
              className={`rounded-xl py-2 text-sm font-bold ring-1 transition ${
                outcome === o.key
                  ? `${o.color} text-white ring-transparent`
                  : "bg-white text-slate-600 ring-slate-200"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-semibold text-slate-700">
          ③ 落下地点をタップ {player ? `（${player.jersey ?? ""} ${player.name}）` : "（先に選手を選択）"}
        </p>
        <TargetCourt onTap={handleTap} className={player ? "" : "pointer-events-none opacity-60"} />
      </div>
    </div>
  );
}
