"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createTactic } from "@/lib/db";
import { PLAYBOOK } from "@/lib/playbook";
import TacticViewer from "@/components/tactics/TacticViewer";
import { PageHeader, Spinner } from "@/components/ui";

export default function PlaybookPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const isCoach = profile?.role === "coach";

  const categories = useMemo(
    () => ["すべて", ...Array.from(new Set(PLAYBOOK.map((p) => p.category)))],
    [],
  );
  const [cat, setCat] = useState("すべて");
  const [selectedId, setSelectedId] = useState(PLAYBOOK[0].id);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const list = useMemo(
    () => (cat === "すべて" ? PLAYBOOK : PLAYBOOK.filter((p) => p.category === cat)),
    [cat],
  );
  const selected = PLAYBOOK.find((p) => p.id === selectedId) ?? PLAYBOOK[0];

  async function saveToTeam() {
    if (!profile?.teamId) return;
    setSaving(true);
    try {
      await createTactic({
        teamId: profile.teamId,
        createdBy: profile.uid,
        title: `【お手本】${selected.title}`,
        description: selected.description,
        rotation: selected.rotation,
        players: selected.players,
        keyframes: selected.keyframes,
      });
      setSaved(true);
      setTimeout(() => router.push("/app/tactics"), 800);
    } catch {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="プロ戦術ライブラリ" subtitle="お手本をアニメで予習しよう" />

      {/* category filter */}
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`chip shrink-0 ring-1 transition ${
              cat === c ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-600 ring-slate-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* preset chooser */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {list.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setSelectedId(p.id);
              setSaved(false);
            }}
            className={`shrink-0 rounded-xl px-3 py-2 text-left text-xs ring-1 transition ${
              selectedId === p.id
                ? "bg-brand-50 ring-brand-300"
                : "bg-white ring-slate-200"
            }`}
          >
            <span className="block font-bold text-slate-800">{p.title}</span>
            <span className="chip mt-0.5 bg-slate-100 text-slate-500">{p.category}</span>
          </button>
        ))}
      </div>

      {/* viewer */}
      <div className="card mb-3">
        <p className="text-sm font-bold text-slate-900">{selected.title}</p>
        <p className="mt-1 text-xs text-slate-600">{selected.description}</p>
      </div>

      <TacticViewer tactic={selected} />

      {isCoach && (
        <button onClick={saveToTeam} disabled={saving || saved} className="btn-primary mt-4 w-full">
          {saving ? <Spinner /> : saved ? "保存しました ✓" : "このお手本をチームに保存"}
        </button>
      )}

      <Link href="/app/tactics" className="mt-4 block text-center text-sm text-slate-400">
        ← ローテ一覧に戻る
      </Link>
    </div>
  );
}
