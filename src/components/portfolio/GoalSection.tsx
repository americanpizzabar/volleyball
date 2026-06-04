"use client";

import { useMemo, useState } from "react";
import { useCollection } from "@/lib/firebase/useCollection";
import {
  createGoal,
  deleteGoal,
  goalsByUserQuery,
  practicesQuery,
  setGoalStatus,
  updateGoal,
} from "@/lib/firebase/db";
import {
  GOAL_STATUS_LABELS,
  type Goal,
  type GoalStatus,
  type Practice,
} from "@/lib/types";
import { EmptyState, Spinner } from "../ui";

const STATUS_STYLE: Record<GoalStatus, string> = {
  active: "bg-blue-100 text-blue-700",
  done: "bg-emerald-100 text-emerald-700",
  dropped: "bg-slate-200 text-slate-500",
};

export default function GoalSection({
  teamId,
  targetUid,
  targetName,
  canEdit,
}: {
  teamId: string;
  targetUid: string;
  targetName: string;
  canEdit: boolean;
}) {
  const { data: goals } = useCollection<Goal>(
    () => goalsByUserQuery(targetUid),
    [targetUid],
  );
  const { data: practices } = useCollection<Practice>(
    () => practicesQuery(teamId),
    [teamId],
  );
  const practiceTitle = useMemo(() => {
    const map = new Map<string, string>();
    practices.forEach((p) => map.set(p.id, `${p.date} ${p.title}`));
    return map;
  }, [practices]);

  const sorted = useMemo(
    () =>
      [...goals].sort((a, b) => {
        const order = { active: 0, done: 1, dropped: 2 };
        return order[a.status] - order[b.status] || (b.createdAt ?? 0) - (a.createdAt ?? 0);
      }),
    [goals],
  );

  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      {canEdit &&
        (open ? (
          <GoalForm
            teamId={teamId}
            targetUid={targetUid}
            targetName={targetName}
            practices={practices}
            onDone={() => setOpen(false)}
          />
        ) : (
          <button onClick={() => setOpen(true)} className="btn-primary w-full">
            ＋ 目標を立てる
          </button>
        ))}

      {sorted.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="まだ目標がありません"
          description={canEdit ? "今月の目標を設定してPDCAを回そう。" : undefined}
        />
      ) : (
        sorted.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            practiceTitle={practiceTitle}
            canEdit={canEdit}
          />
        ))
      )}
    </div>
  );
}

function GoalForm({
  teamId,
  targetUid,
  targetName,
  practices,
  onDone,
}: {
  teamId: string;
  targetUid: string;
  targetName: string;
  practices: (Practice & { id: string })[];
  onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [metric, setMetric] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [practiceIds, setPracticeIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    await createGoal({
      teamId,
      userId: targetUid,
      userName: targetName,
      title: title.trim(),
      metric: metric.trim(),
      dueDate,
      practiceIds,
      reflection: "",
      status: "active",
    });
    setBusy(false);
    onDone();
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      <p className="text-sm font-bold text-slate-700">目標 (Plan)</p>
      <input
        className="input"
        placeholder="例: サーブミスを1試合1本以下にする"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        className="input"
        placeholder="達成基準（例: 練習試合3試合連続で達成）"
        value={metric}
        onChange={(e) => setMetric(e.target.value)}
      />
      <div>
        <label className="label">期限</label>
        <input
          type="date"
          className="input"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>
      {practices.length > 0 && (
        <div>
          <label className="label">紐づく練習メニュー (Do)</label>
          <div className="max-h-40 space-y-1.5 overflow-y-auto">
            {practices.map((p) => (
              <label
                key={p.id}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm ring-1 ${
                  practiceIds.includes(p.id)
                    ? "bg-brand-50 ring-brand-300"
                    : "bg-white ring-slate-200"
                }`}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-600"
                  checked={practiceIds.includes(p.id)}
                  onChange={() =>
                    setPracticeIds((prev) =>
                      prev.includes(p.id)
                        ? prev.filter((x) => x !== p.id)
                        : [...prev, p.id],
                    )
                  }
                />
                {p.date} {p.title}
              </label>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={onDone} className="btn-ghost flex-1">
          キャンセル
        </button>
        <button disabled={busy} className="btn-primary flex-1">
          {busy ? <Spinner /> : "保存"}
        </button>
      </div>
    </form>
  );
}

function GoalCard({
  goal,
  practiceTitle,
  canEdit,
}: {
  goal: Goal;
  practiceTitle: Map<string, string>;
  canEdit: boolean;
}) {
  const [reflection, setReflection] = useState(goal.reflection);
  const [editing, setEditing] = useState(false);

  return (
    <div className="card space-y-2">
      <div className="flex items-start justify-between gap-2">
        <span className={`chip ${STATUS_STYLE[goal.status]}`}>
          {GOAL_STATUS_LABELS[goal.status]}
        </span>
        {canEdit && (
          <button
            onClick={() => {
              if (confirm("この目標を削除しますか？")) deleteGoal(goal.id);
            }}
            className="text-xs text-slate-400 hover:text-red-500"
          >
            削除
          </button>
        )}
      </div>

      <p className="font-bold text-slate-900">{goal.title}</p>
      {goal.metric && (
        <p className="text-sm text-slate-600">
          <span className="font-semibold">達成基準:</span> {goal.metric}
        </p>
      )}
      {goal.dueDate && <p className="text-xs text-slate-400">期限: {goal.dueDate}</p>}

      {goal.practiceIds?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500">紐づく練習 (Do)</p>
          <ul className="mt-1 space-y-0.5">
            {goal.practiceIds.map((id) => (
              <li key={id} className="text-sm text-brand-700">
                ・{practiceTitle.get(id) ?? "（削除された練習）"}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Check: reflection */}
      <div>
        <p className="text-xs font-semibold text-slate-500">振り返り (Check)</p>
        {canEdit && editing ? (
          <div className="mt-1 space-y-2">
            <textarea
              className="input min-h-20"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
            />
            <button
              onClick={async () => {
                await updateGoal(goal.id, { reflection });
                setEditing(false);
              }}
              className="btn-primary px-3 py-1.5 text-xs"
            >
              保存
            </button>
          </div>
        ) : (
          <p
            onClick={() => canEdit && setEditing(true)}
            className={`mt-1 whitespace-pre-wrap text-sm ${
              goal.reflection ? "text-slate-700" : "text-slate-400"
            } ${canEdit ? "cursor-pointer" : ""}`}
          >
            {goal.reflection || (canEdit ? "タップして振り返りを記入" : "未記入")}
          </p>
        )}
      </div>

      {/* Act: status */}
      {canEdit && (
        <div className="flex gap-1.5 pt-1">
          {(Object.keys(GOAL_STATUS_LABELS) as GoalStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setGoalStatus(goal.id, s)}
              className={`chip flex-1 justify-center ring-1 transition ${
                goal.status === s
                  ? "bg-brand-600 text-white ring-brand-600"
                  : "bg-white text-slate-500 ring-slate-200"
              }`}
            >
              {GOAL_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
