"use client";

import { useDoc } from "@/lib/useDoc";
import { mapSkillSheet, setRating } from "@/lib/db";
import { RATING_LABELS, skillGroupsForPosition } from "@/lib/skills";
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
  const groups = skillGroupsForPosition(position);

  const self = sheet?.self ?? {};
  const coach = sheet?.coach ?? {};

  return (
    <div className="space-y-4">
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
                  onChange={(v) => setRating(targetUid, teamId, "self", it.key, v)}
                />
                <RatingRow
                  label="指導者"
                  color="accent"
                  value={coach[it.key]}
                  editable={canEditCoach}
                  onChange={(v) => setRating(targetUid, teamId, "coach", it.key, v)}
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
