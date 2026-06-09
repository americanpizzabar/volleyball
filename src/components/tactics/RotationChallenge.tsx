"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CourtCanvas from "./CourtCanvas";
import Confetti from "@/components/Confetti";
import { detectFaults, safeZoneForSlot, type Pt } from "@/lib/rotation";
import { playLevelUp } from "@/lib/sfx";
import type { TacticPlayer } from "@/lib/types";

interface Tok {
  id: string;
  slot: number;
  x: number;
  y: number;
}

const PLAYERS: TacticPlayer[] = [1, 2, 3, 4, 5, 6].map((n) => ({
  id: `s${n}`,
  label: String(n),
  team: "ours" as const,
}));

function scramble(): Tok[] {
  for (let attempt = 0; attempt < 40; attempt++) {
    const toks: Tok[] = [1, 2, 3, 4, 5, 6].map((slot) => ({
      id: `s${slot}`,
      slot,
      x: 10 + Math.random() * 80,
      y: 54 + Math.random() * 42,
    }));
    const pos: Record<number, Pt> = {};
    toks.forEach((t) => (pos[t.slot] = { x: t.x, y: t.y }));
    if (detectFaults(pos).length > 0) return toks;
  }
  // フォールバック（必ず反則になる配置）
  return [1, 2, 3, 4, 5, 6].map((slot, i) => ({ id: `s${slot}`, slot, x: 20 + i * 12, y: 75 }));
}

export default function RotationChallenge() {
  const [tokens, setTokens] = useState<Tok[]>(() => scramble());
  const [selected, setSelected] = useState<string | null>(null);
  const [hint, setHint] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [solved, setSolved] = useState(false);
  const [best, setBest] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // best time from localStorage
  useEffect(() => {
    const b = typeof window !== "undefined" ? localStorage.getItem("rotChallengeBest") : null;
    if (b) setBest(Number(b));
  }, []);

  const startTimer = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [startTimer]);

  const slotPos = useMemo(() => {
    const pos: Record<number, Pt> = {};
    tokens.forEach((t) => (pos[t.slot] = { x: t.x, y: t.y }));
    return pos;
  }, [tokens]);

  const faults = useMemo(() => detectFaults(slotPos), [slotPos]);
  const slotToId = useMemo(() => {
    const m: Record<number, string> = {};
    tokens.forEach((t) => (m[t.slot] = t.id));
    return m;
  }, [tokens]);
  const faultPairs = useMemo<[string, string][]>(
    () => faults.map((f) => [slotToId[f.a], slotToId[f.b]] as [string, string]),
    [faults, slotToId],
  );

  const safeZone = useMemo(() => {
    if (!hint || !selected) return null;
    const t = tokens.find((x) => x.id === selected);
    return t ? safeZoneForSlot(t.slot, slotPos) : null;
  }, [hint, selected, tokens, slotPos]);

  // 反則ゼロで成立
  useEffect(() => {
    if (!solved && faults.length === 0) {
      setSolved(true);
      if (timer.current) clearInterval(timer.current);
      playLevelUp();
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([40, 40, 80]);
      setBest((prev) => {
        const next = prev == null ? seconds : Math.min(prev, seconds);
        if (typeof window !== "undefined") localStorage.setItem("rotChallengeBest", String(next));
        return next;
      });
    }
  }, [faults.length, solved, seconds]);

  function moveToken(id: string, x: number, y: number) {
    if (solved) return;
    setTokens((ts) => ts.map((t) => (t.id === id ? { ...t, x, y } : t)));
  }

  function newPuzzle() {
    setTokens(scramble());
    setSelected(null);
    setSeconds(0);
    setSolved(false);
    startTimer();
  }

  const positions = Object.fromEntries(tokens.map((t) => [t.id, { x: t.x, y: t.y }]));

  return (
    <div className="space-y-3">
      <div className="card flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-700">かぶりを直せ！</p>
          <p className="text-xs text-slate-500">全員を反則(かぶり)のない配置にドラッグ</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-black text-brand-700">{seconds}s</p>
          {best != null && <p className="text-[11px] text-slate-400">ベスト {best}s</p>}
        </div>
      </div>

      <div className="relative card">
        <CourtCanvas
          players={PLAYERS}
          positions={positions}
          onMove={moveToken}
          faults={faultPairs}
          safeZone={safeZone}
        />
        {solved && (
          <>
            <Confetti />
            <div className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center">
              <div className="rally-pop text-4xl font-black text-emerald-500 drop-shadow">PERFECT!!</div>
              <div className="rally-sub mt-2 rounded-full bg-white/90 px-3 py-1 text-sm font-bold text-brand-700 ring-1 ring-brand-200">
                クリア {seconds}秒
              </div>
            </div>
          </>
        )}
      </div>

      {/* select + hint */}
      <div className="card">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500">
            {faults.length > 0 ? `反則 ${faults.length} 箇所` : "反則なし ✓"}
          </p>
          <button
            onClick={() => setHint((v) => !v)}
            className={`chip ring-1 ${hint ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-600 ring-slate-200"}`}
          >
            ヒント（安全ゾーン）
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {tokens.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(selected === t.id ? null : t.id)}
              className={`chip ring-1 transition ${
                selected === t.id ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-600 ring-slate-200"
              }`}
            >
              {t.slot}
            </button>
          ))}
        </div>
        {faults.length > 0 && (
          <ul className="mt-2 space-y-0.5">
            {faults.map((f, i) => (
              <li key={i} className="text-xs text-red-600">・{f.reason}</li>
            ))}
          </ul>
        )}
      </div>

      <button onClick={newPuzzle} className="btn-primary w-full">
        {solved ? "次の問題へ" : "別の問題にする"}
      </button>
    </div>
  );
}
