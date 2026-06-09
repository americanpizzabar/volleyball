"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/lib/useCollection";
import { teamStatsQuery } from "@/lib/db";
import type { StatEvent } from "@/lib/stats";
import Confetti from "@/components/Confetti";
import { playKill, playLevelUp } from "@/lib/sfx";
import { FullScreenLoader, PageHeader } from "@/components/ui";

interface Boss {
  key: string;
  name: string;
  emoji: string;
  off: number;
  def: number;
  desc: string;
}
const BOSSES: Boss[] = [
  { key: "vleague", name: "Vリーグ選抜", emoji: "🛡️", off: 0.85, def: 0.85, desc: "国内トップリーグ。まずはここを攻略！" },
  { key: "national", name: "日本代表", emoji: "🐉", off: 1.1, def: 1.0, desc: "雲の上のラスボス。全数値を磨け！" },
];

function teamTotals(events: StatEvent[]) {
  const t = { spike: 0, kill: 0, err: 0, blk: 0, serve: 0, ace: 0, rec: 0, recRet: 0, block: 0 };
  for (const e of events) {
    if (e.skill === "spike") {
      t.spike++;
      if (e.result === "kill") t.kill++;
      else if (e.result === "error") t.err++;
      else if (e.result === "blocked") t.blk++;
    } else if (e.skill === "serve") {
      t.serve++;
      if (e.result === "ace") t.ace++;
    } else if (e.skill === "reception") {
      t.rec++;
      if (["a", "b", "c"].includes(e.result)) t.recRet++;
    } else if (e.skill === "block" && e.result === "kill") t.block++;
  }
  return t;
}

export default function ShadowBattlePage() {
  const { profile } = useAuth();
  const teamId = profile?.teamId ?? null;
  const { data: events, loading } = useCollection<StatEvent>(
    () => (teamId ? teamStatsQuery(teamId) : null),
    [teamId],
  );

  const tt = useMemo(() => teamTotals(events), [events]);
  const killR = tt.spike ? (tt.kill / tt.spike) * 100 : 0;
  const effR = tt.spike ? ((tt.kill - tt.err - tt.blk) / tt.spike) * 100 : 0;
  const aceR = tt.serve ? (tt.ace / tt.serve) * 100 : 0;
  const recR = tt.rec ? (tt.recRet / tt.rec) * 100 : 0;

  const offense = Math.min(1.3, ((killR / 58 + effR / 35 + aceR / 10) / 3) || 0);
  const defense = Math.min(1.3, ((recR / 92 + Math.min(1, tt.block / 15)) / 2) || 0);

  const [boss, setBoss] = useState<Boss>(BOSSES[0]);
  const [bossHp, setBossHp] = useState(100);
  const [myHp, setMyHp] = useState(100);
  const [phase, setPhase] = useState<"idle" | "fight" | "win" | "lose">("idle");
  const raf = useRef<ReturnType<typeof setInterval> | null>(null);

  function start() {
    if (events.length === 0) return;
    setPhase("fight");
    let bh = 100, mh = 100;
    setBossHp(100); setMyHp(100);
    if (raf.current) clearInterval(raf.current);
    raf.current = setInterval(() => {
      bh -= 16 * (offense / boss.def);
      mh -= 16 * Math.max(0.2, boss.off - defense);
      setBossHp(Math.max(0, Math.round(bh)));
      setMyHp(Math.max(0, Math.round(mh)));
      if (bh <= 0 || mh <= 0) {
        if (raf.current) clearInterval(raf.current);
        const win = bh <= 0 && bh <= mh;
        setPhase(win ? "win" : "lose");
        if (win) playLevelUp();
        else playKill();
      }
    }, 700);
  }

  if (loading) return <FullScreenLoader />;

  return (
    <div>
      <PageHeader title="レジェンド・シャドウ・バトル" subtitle="プロのデータをスタッツで攻略せよ" />

      {events.length === 0 ? (
        <p className="card text-sm text-slate-500">
          試合スタッツがまだありません。記録するほど、あなたのチームは強くなり、プロに挑めます。
        </p>
      ) : (
        <>
          {/* boss select */}
          <div className="mb-3 grid grid-cols-2 gap-2">
            {BOSSES.map((b) => (
              <button
                key={b.key}
                onClick={() => { setBoss(b); setPhase("idle"); }}
                className={`rounded-xl px-3 py-2 text-left ring-1 transition ${
                  boss.key === b.key ? "bg-brand-50 ring-brand-300" : "bg-white ring-slate-200"
                }`}
              >
                <span className="text-2xl">{b.emoji}</span>
                <p className="text-sm font-bold text-slate-800">{b.name}</p>
                <p className="text-[10px] text-slate-500">{b.desc}</p>
              </button>
            ))}
          </div>

          {/* battle stage */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-brand-800 p-4 text-white">
            {phase === "win" && <Confetti />}
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-4xl">🏐</p>
                <p className="text-xs">自チーム</p>
                <HpBar hp={myHp} color="from-emerald-400 to-emerald-300" />
              </div>
              <span className="text-2xl font-black text-amber-300">VS</span>
              <div className="text-center">
                <p className="text-4xl">{boss.emoji}</p>
                <p className="text-xs">{boss.name}</p>
                <HpBar hp={bossHp} color="from-red-400 to-orange-300" />
              </div>
            </div>

            {phase === "win" && <p className="mt-4 text-center text-2xl font-black text-amber-300">WIN！討伐成功！🎉</p>}
            {phase === "lose" && <p className="mt-4 text-center text-xl font-black text-red-300">惜敗… 数値を磨いて再挑戦！</p>}
            {phase === "fight" && <p className="mt-4 text-center text-sm text-white/70">バトル中…</p>}
          </div>

          <button onClick={start} disabled={phase === "fight"} className="btn-primary mt-3 w-full py-3">
            {phase === "idle" ? "⚔ 対戦開始" : phase === "fight" ? "戦闘中…" : "もう一度挑戦"}
          </button>

          {/* comparison */}
          <p className="mt-5 mb-2 text-sm font-bold text-slate-700">自チーム vs {boss.name}（基準）</p>
          <Compare label="スパイク決定率" you={killR} target={boss.key === "national" ? 58 : 50} unit="%" />
          <Compare label="スパイク効果率" you={effR} target={boss.key === "national" ? 35 : 25} unit="%" />
          <Compare label="サービスエース率" you={aceR} target={boss.key === "national" ? 10 : 6} unit="%" />
          <Compare label="レセプション返球率" you={recR} target={boss.key === "national" ? 92 : 85} unit="%" />

          <p className="mt-3 text-center text-xs text-slate-400">
            ※ 基準値は公開統計に基づく概算の参考値です。記録が増えるほど精度が上がります。
          </p>
        </>
      )}

      <Link href="/app" className="mt-4 block text-center text-sm text-slate-400">← ホームに戻る</Link>
    </div>
  );
}

function HpBar({ hp, color }: { hp: number; color: string }) {
  return (
    <div className="mt-1 h-2.5 w-20 overflow-hidden rounded-full bg-white/25">
      <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`} style={{ width: `${hp}%` }} />
    </div>
  );
}

function Compare({ label, you, target, unit }: { label: string; you: number; target: number; unit: string }) {
  const max = Math.max(target * 1.3, you, 1);
  const reached = you >= target;
  return (
    <div className="card mb-2">
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-semibold text-slate-800">{label}</span>
        <span className={`font-black ${reached ? "text-emerald-600" : "text-slate-900"}`}>
          {Math.round(you)}{unit} {reached ? "✓" : ""}
        </span>
      </div>
      <div className="relative h-3 w-full rounded-full bg-slate-100">
        <div className={`absolute inset-y-0 left-0 rounded-full ${reached ? "bg-emerald-500" : "bg-brand-500"}`} style={{ width: `${Math.min(100, (you / max) * 100)}%` }} />
        <span className="absolute inset-y-[-2px] w-0.5 rounded bg-amber-500" style={{ left: `${Math.min(100, (target / max) * 100)}%` }} title={`基準 ${target}${unit}`} />
      </div>
      <p className="mt-1 text-[11px] text-slate-400">目標(基準) {target}{unit}</p>
    </div>
  );
}
