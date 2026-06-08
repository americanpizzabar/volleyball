"use client";

import { useMemo, useState } from "react";
import { useDoc } from "@/lib/useDoc";
import { useCollection } from "@/lib/useCollection";
import { mapSkillSheet, setRating, skillSheetsByTeamQuery } from "@/lib/db";
import { RADAR_AXES, RATING_LABELS, radarValues, skillGroupsForPosition } from "@/lib/skills";
import RadarChart from "./RadarChart";
import type { Position, SkillSheet as Sheet } from "@/lib/types";

export default function SkillSheet({
  targetUid,
  teamId,
  position,
  canEditSelf,
  canEditCoach,
}: {
  targetUid: string;
  teamId: string;
  position: Position | null;
  canEditSelf: boolean;
  canEditCoach: boolean;
}) {
  const { data: sheet } = useDoc<Sheet>("skill_sheets", targetUid, mapSkillSheet, "user_id");
  const { data: allSheets } = useCollection<Sheet>(
    () => skillSheetsByTeamQuery(teamId),
    [teamId],
  );
  const groups = skillGroupsForPosition(position);

  const self = sheet?.self ?? {};
  const coach = sheet?.coach ?? {};

  const [levelUp, setLevelUp] = useState<{ label: string; from: number; to: number } | null>(null);

  function rate(side: "self" | "coach", key: string, label: string, v: number) {
    const prev = (side === "self" ? self[key] : coach[key]) ?? 0;
    if (v > prev) {
      setLevelUp({ label, from: prev, to: v });
      setTimeout(() => setLevelUp(null), 1600);
    }
    setRating(targetUid, teamId, side, key, v);
  }

  // Radar: this player's values vs. team average.
  const selfRadar = useMemo(() => radarValues(self), [self]);
  const avgRadar = useMemo(() => {
    if (allSheets.length === 0) return RADAR_AXES.map(() => 0);
    const sums = RADAR_AXES.map(() => 0);
    const counts = RADAR_AXES.map(() => 0);
    for (const s of allSheets) {
      radarValues(s.self ?? {}).forEach((v, i) => {
        if (v > 0) {
          sums[i] += v;
          counts[i] += 1;
        }
      });
    }
    return sums.map((sum, i) => (counts[i] ? sum / counts[i] : 0));
  }, [allSheets]);

  const hasRadar = selfRadar.some((v) => v > 0);

  return (
    <div className="relative space-y-4">
      {/* level-up effect */}
      {levelUp && (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4">
          <div className="rally-pop rounded-2xl bg-gradient-to-r from-brand-600 to-blue-500 px-5 py-3 text-center text-white shadow-lg">
            <p className="text-xs font-semibold opacity-90">{levelUp.label}</p>
            <p className="text-xl font-black">
              Lv.{levelUp.from} <span className="opacity-70">→</span> Lv.{levelUp.to} ⬆️✨
            </p>
          </div>
        </div>
      )}

      <div className="card">
        <p className="mb-1 text-sm font-bold text-slate-700">能力レーダー</p>
        {hasRadar ? (
          <>
            <RadarChart labels={RADAR_AXES.map((a) => a.label)} self={selfRadar} avg={avgRadar} />
            <div className="flex items-center justify-center gap-4 text-xs">
              <Legend color="bg-brand-500" label="本人" />
              <Legend color="bg-accent-500" label="チーム平均" />
            </div>
          </>
        ) : (
          <p className="py-6 text-center text-sm text-slate-400">
            下のスキルを評価するとレーダーチャートが表示されます。
          </p>
        )}
      </div>

      <div className="card flex items-center gap-4 text-xs">
        <Legend color="bg-brand-500" label="自己評価" />
        <Legend color="bg-accent-500" label="指導者評価" />
        <span className="ml-auto text-slate-400">5段階</span>
      </div>

      {groups.map((g) => (
        <div key={g.title} className="card">
          <p className="mb-3 text-sm font-bold text-slate-700">{g.title}</p>
          <div className="space-y-4">
            {g.items.map((it) => (
              <div key={it.key}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800">{it.label}</span>
                  <span className="text-[11px] text-slate-400">
                    {self[it.key] ? RATING_LABELS[self[it.key]] : "未評価"}
                  </span>
                </div>
                <RatingRow
                  label="自分"
                  color="brand"
                  value={self[it.key]}
                  editable={canEditSelf}
                  onChange={(v) => rate("self", it.key, it.label, v)}
                />
                <RatingRow
                  label="指導者"
                  color="accent"
                  value={coach[it.key]}
                  editable={canEditCoach}
                  onChange={(v) => rate("coach", it.key, it.label, v)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RatingRow({
  label,
  color,
  value,
  editable,
  onChange,
}: {
  label: string;
  color: "brand" | "accent";
  value: number | undefined;
  editable: boolean;
  onChange: (v: number) => void;
}) {
  const active = color === "brand" ? "bg-brand-500 text-white" : "bg-accent-500 text-white";
  return (
    <div className="mt-1 flex items-center gap-2">
      <span className="w-12 shrink-0 text-[11px] text-slate-500">{label}</span>
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4, 5].map((n) => {
          const on = (value ?? 0) >= n;
          return (
            <button
              key={n}
              disabled={!editable}
              onClick={() => onChange(n)}
              className={`h-7 flex-1 rounded-md text-xs font-semibold transition ${
                on ? active : "bg-slate-100 text-slate-400"
              } ${editable ? "active:scale-95" : "cursor-default"}`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-slate-600">
      <span className={`inline-block h-3 w-3 rounded ${color}`} />
      {label}
    </span>
  );
}
