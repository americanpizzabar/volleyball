"use client";

import { useState } from "react";
import { RESULTS, SKILLS, type Skill, type Tone } from "@/lib/stats";

export interface RosterPlayer {
  id: string;
  name: string;
  jersey: number | null;
}

const TONE_CLASS: Record<Tone, string> = {
  good: "bg-emerald-500 text-white ring-emerald-500",
  neutral: "bg-white text-slate-700 ring-slate-300",
  bad: "bg-red-500 text-white ring-red-500",
};

/**
 * 3-tap stat entry: player → skill → result. Calls onRecord once a result is
 * chosen, then returns to the player grid for the next rally.
 */
export default function StatRecorder({
  players,
  onRecord,
}: {
  players: RosterPlayer[];
  onRecord: (player: RosterPlayer, skill: Skill, result: string) => void;
}) {
  const [player, setPlayer] = useState<RosterPlayer | null>(null);
  const [skill, setSkill] = useState<Skill | null>(null);

  function reset() {
    setPlayer(null);
    setSkill(null);
  }

  if (player && skill) {
    return (
      <div className="card">
        <StepHeader
          onBack={() => setSkill(null)}
          crumbs={[playerLabel(player), SKILLS.find((s) => s.key === skill)!.label]}
        />
        <div className="grid grid-cols-2 gap-2">
          {RESULTS[skill].map((r) => (
            <button
              key={r.key}
              onClick={() => {
                onRecord(player, skill, r.key);
                reset();
              }}
              className={`rounded-2xl py-5 text-base font-bold ring-1 transition active:scale-95 ${TONE_CLASS[r.tone]}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (player) {
    return (
      <div className="card">
        <StepHeader onBack={reset} crumbs={[playerLabel(player)]} />
        <div className="grid grid-cols-3 gap-2">
          {SKILLS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSkill(s.key)}
              className="flex flex-col items-center gap-1 rounded-2xl bg-white py-4 ring-1 ring-slate-200 transition hover:bg-slate-50 active:scale-95"
            >
              <span className="text-2xl">{s.emoji}</span>
              <span className="text-xs font-semibold text-slate-700">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <p className="mb-3 text-sm font-semibold text-slate-700">
        ① 選手をタップ
      </p>
      {players.length === 0 ? (
        <p className="text-sm text-slate-500">
          記録できる選手がいません。設定画面で部員の背番号を登録してください。
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => setPlayer(p)}
              className="flex flex-col items-center gap-0.5 rounded-2xl bg-brand-50 py-3 ring-1 ring-brand-100 transition hover:bg-brand-100 active:scale-95"
            >
              <span className="text-xl font-black text-brand-700">
                {p.jersey ?? "—"}
              </span>
              <span className="w-full truncate px-1 text-center text-[11px] text-slate-600">
                {p.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StepHeader({ onBack, crumbs }: { onBack: () => void; crumbs: string[] }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <button onClick={onBack} className="btn-ghost px-2 py-1 text-xs">
        ← 戻る
      </button>
      <p className="text-sm font-semibold text-slate-700">
        {crumbs.join(" ＞ ")}
      </p>
    </div>
  );
}

function playerLabel(p: RosterPlayer): string {
  return p.jersey != null ? `${p.jersey} ${p.name}` : p.name;
}
