"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CourtCanvas from "./CourtCanvas";
import { cryptoId, defaultKeyframe, defaultPlayers } from "@/lib/court";
import type {
  Tactic,
  TacticKeyframe,
  TacticPlayer,
} from "@/lib/types";
import { Spinner } from "../ui";

export interface TacticDraft {
  title: string;
  description: string;
  rotation: number;
  players: TacticPlayer[];
  keyframes: TacticKeyframe[];
}

function emptyDraft(): TacticDraft {
  return {
    title: "",
    description: "",
    rotation: 1,
    players: defaultPlayers(),
    keyframes: [defaultKeyframe("基本配置")],
  };
}

export default function TacticEditor({
  initial,
  onSave,
}: {
  initial?: Tactic;
  onSave: (draft: TacticDraft) => Promise<void>;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<TacticDraft>(
    initial
      ? {
          title: initial.title,
          description: initial.description,
          rotation: initial.rotation,
          players: initial.players,
          keyframes: initial.keyframes,
        }
      : emptyDraft(),
  );
  const [activeKf, setActiveKf] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const frame = draft.keyframes[activeKf];

  function moveToken(id: string, x: number, y: number) {
    setDraft((d) => {
      const keyframes = d.keyframes.map((kf, i) =>
        i === activeKf
          ? { ...kf, positions: { ...kf.positions, [id]: { x, y } } }
          : kf,
      );
      return { ...d, keyframes };
    });
  }

  function addKeyframe() {
    setDraft((d) => {
      const clone: TacticKeyframe = {
        id: cryptoId(),
        name: `ステップ${d.keyframes.length}`,
        positions: structuredClone(d.keyframes[activeKf]?.positions ?? {}),
      };
      return { ...d, keyframes: [...d.keyframes, clone] };
    });
    setActiveKf(draft.keyframes.length);
  }

  function renameKeyframe(name: string) {
    setDraft((d) => ({
      ...d,
      keyframes: d.keyframes.map((kf, i) => (i === activeKf ? { ...kf, name } : kf)),
    }));
  }

  function deleteKeyframe() {
    if (draft.keyframes.length <= 1) return;
    setDraft((d) => ({
      ...d,
      keyframes: d.keyframes.filter((_, i) => i !== activeKf),
    }));
    setActiveKf((i) => Math.max(0, i - 1));
  }

  function addToken(team: TacticPlayer["team"]) {
    const label =
      team === "ball"
        ? "●"
        : prompt(team === "ours" ? "自チームの番号/役割（例: S, 4）" : "相手の番号") ?? "";
    if (team !== "ball" && !label) return;
    const id = cryptoId();
    const player: TacticPlayer = { id, label, team };
    const spawn = team === "theirs" ? { x: 50, y: 30 } : { x: 50, y: 75 };
    setDraft((d) => ({
      ...d,
      players: [...d.players, player],
      keyframes: d.keyframes.map((kf) => ({
        ...kf,
        positions: { ...kf.positions, [id]: { ...spawn } },
      })),
    }));
  }

  function removeToken(id: string) {
    setDraft((d) => ({
      ...d,
      players: d.players.filter((p) => p.id !== id),
      keyframes: d.keyframes.map((kf) => {
        const positions = { ...kf.positions };
        delete positions[id];
        return { ...kf, positions };
      }),
    }));
  }

  async function handleSave() {
    if (!draft.title.trim()) {
      setError("タイトルを入力してください。");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ ...draft, title: draft.title.trim() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました。");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <div>
          <label className="label">タイトル</label>
          <input
            className="input"
            placeholder="例: ローテP1 サーブレシーブ体系"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="label">ローテーション</label>
            <select
              className="input"
              value={draft.rotation}
              onChange={(e) => setDraft({ ...draft, rotation: Number(e.target.value) })}
            >
              {[1, 2, 3, 4, 5, 6].map((r) => (
                <option key={r} value={r}>
                  ローテ {r}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">説明・意図</label>
          <textarea
            className="input min-h-20"
            placeholder="この配置・動きのねらいを書きましょう"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </div>
      </div>

      {/* Keyframe editor */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">
            ステップ（アニメーションのコマ）
          </p>
          <button onClick={addKeyframe} className="btn-ghost px-3 py-1.5 text-xs">
            ＋ コマ追加
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {draft.keyframes.map((kf, i) => (
            <button
              key={kf.id}
              onClick={() => setActiveKf(i)}
              className={`chip ring-1 transition ${
                i === activeKf
                  ? "bg-brand-600 text-white ring-brand-600"
                  : "bg-white text-slate-600 ring-slate-200"
              }`}
            >
              {i + 1}. {kf.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            className="input flex-1"
            value={frame?.name ?? ""}
            onChange={(e) => renameKeyframe(e.target.value)}
            placeholder="コマ名（例: サーブ時）"
          />
          <button
            onClick={deleteKeyframe}
            disabled={draft.keyframes.length <= 1}
            className="btn-danger px-3 py-2 text-xs"
          >
            削除
          </button>
        </div>

        <p className="text-xs text-slate-500">
          下のコートで選手をドラッグして「{frame?.name}」の配置を作ります。コマを複数作ると再生時に動きます。
        </p>

        <CourtCanvas
          players={draft.players}
          positions={frame?.positions ?? {}}
          onMove={moveToken}
        />

        <div className="flex flex-wrap gap-2">
          <button onClick={() => addToken("ours")} className="btn-ghost px-3 py-1.5 text-xs">
            ＋ 自チーム
          </button>
          <button onClick={() => addToken("theirs")} className="btn-ghost px-3 py-1.5 text-xs">
            ＋ 相手
          </button>
          <button onClick={() => addToken("ball")} className="btn-ghost px-3 py-1.5 text-xs">
            ＋ ボール
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {draft.players.map((p) => (
            <button
              key={p.id}
              onClick={() => removeToken(p.id)}
              className="chip bg-slate-100 text-slate-600 ring-1 ring-slate-200"
              title="タップで削除"
            >
              {p.team === "ball" ? "●ボール" : `${p.team === "ours" ? "自" : "敵"}${p.label}`} ✕
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button onClick={() => router.back()} className="btn-ghost flex-1">
          キャンセル
        </button>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
          {saving ? <Spinner /> : "保存する"}
        </button>
      </div>
    </div>
  );
}
