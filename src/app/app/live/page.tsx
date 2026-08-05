"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/lib/useCollection";
import { teamStatsQuery } from "@/lib/db";
import type { StatEvent } from "@/lib/stats";
import { FullScreenLoader, PageHeader } from "@/components/ui";

const REACTIONS = ["👏", "🔥", "❤️", "💪", "🎉"];

interface Floater {
  id: number;
  emoji: string;
  left: number;
  size: number;
}

const NOTABLE: Record<string, Record<string, string>> = {
  spike: { kill: "スパイク決定！" },
  serve: { ace: "サービスエース！" },
  block: { kill: "シャットアウト！" },
  reception: { a: "ナイスレシーブ！" },
  dig: { up: "ナイスディグ！" },
};

export default function LivePage() {
  const { profile } = useAuth();
  const teamId = profile?.teamId ?? null;

  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [banner, setBanner] = useState<string | null>(null);
  const [text, setText] = useState("");
  const idRef = useRef(0);

  const addFloater = useCallback((emoji: string) => {
    const id = ++idRef.current;
    const f: Floater = { id, emoji, left: 8 + Math.random() * 84, size: 28 + Math.random() * 26 };
    setFloaters((prev) => [...prev, f]);
    setTimeout(() => setFloaters((prev) => prev.filter((x) => x.id !== id)), 2300);
  }, []);

  const burst = useCallback((emoji: string, n = 1) => {
    for (let i = 0; i < n; i++) setTimeout(() => addFloater(emoji), i * 120);
  }, [addFloater]);

  function sendCheer(emoji: string) {
    addFloater(emoji);
  }
  function sendPraise() {
    const t = text.trim();
    if (!t) return;
    setBanner(t);
    burst("📣", 3);
    setTimeout(() => setBanner(null), 2600);
    setText("");
  }

  // 試合の新しいナイスプレーを自動で流す
  const { data: events, loading, refresh } = useCollection<StatEvent>(
    () => (teamId ? teamStatsQuery(teamId) : null),
    [teamId],
  );
  // Realtime was removed in the Neon migration; poll so new plays flow in during
  // a live match (this also picks up plays recorded on another device).
  useEffect(() => {
    if (!teamId) return;
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [teamId, refresh]);

  const seeded = useRef(false);
  const seen = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (loading) return;
    if (!seeded.current) {
      // Seed from the loaded data so existing plays aren't replayed on entry.
      seen.current = new Set(events.map((e) => e.id));
      seeded.current = true;
      return;
    }
    for (const e of events) {
      if (seen.current.has(e.id)) continue;
      seen.current.add(e.id);
      const label = NOTABLE[e.skill]?.[e.result];
      if (label) {
        setBanner(`${e.jersey ?? ""} ${label}`);
        burst("🔥", 4);
        setTimeout(() => setBanner(null), 2400);
      }
    }
  }, [events, loading, burst]);

  if (loading) return <FullScreenLoader />;

  return (
    <div className="relative">
      <PageHeader title="コート・エフェクト・ライブ" subtitle="応援エフェクトで盛り上げよう！" />

      {/* live stage */}
      <div className="relative h-[55vh] overflow-hidden rounded-2xl bg-gradient-to-b from-brand-700 to-slate-900 text-white">
        {/* floaters */}
        {floaters.map((f) => (
          <span
            key={f.id}
            className="floater"
            style={{ left: `${f.left}%`, fontSize: `${f.size}px` }}
          >
            {f.emoji}
          </span>
        ))}

        {/* banner */}
        {banner && (
          <div className="pointer-events-none absolute inset-x-0 top-1/3 flex justify-center px-4">
            <div className="rally-pop rounded-2xl bg-white/95 px-5 py-3 text-center text-xl font-black text-brand-700 shadow-lg ring-2 ring-amber-300">
              {banner}
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-2 text-center text-xs text-white/60">
          タップした応援が画面に弾けます
        </div>
      </div>

      {/* reaction buttons */}
      <div className="mt-3 grid grid-cols-5 gap-2">
        {REACTIONS.map((r) => (
          <button
            key={r}
            onClick={() => sendCheer(r)}
            className="rounded-2xl bg-white py-4 text-3xl shadow-sm ring-1 ring-slate-200 transition active:scale-90"
          >
            {r}
          </button>
        ))}
      </div>

      {/* praise text */}
      <div className="mt-3 flex gap-2">
        <input
          className="input flex-1"
          placeholder="応援コメント（例: 4番ナイス！）"
          value={text}
          maxLength={40}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendPraise();
          }}
        />
        <button onClick={sendPraise} className="btn-primary px-4">送信</button>
      </div>

      <p className="mt-3 text-center text-xs text-slate-400">
        ※ 試合でスパイク決定・エース等を記録すると、自動でこの画面に流れます。
      </p>

      <Link href="/app" className="mt-4 block text-center text-sm text-slate-400">← ホームに戻る</Link>
    </div>
  );
}
