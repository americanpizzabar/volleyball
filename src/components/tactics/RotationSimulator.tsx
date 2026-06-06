"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CourtCanvas from "./CourtCanvas";
import { useAuth } from "@/context/AuthContext";
import { getTeamMembers } from "@/lib/db";
import type { UserProfile } from "@/lib/types";
import {
  detectFaults,
  rotateSlots,
  SLOT_BASE,
  SLOT_RECEIVE,
  type Pt,
} from "@/lib/rotation";
import { FullScreenLoader } from "@/components/ui";

interface Token {
  id: string; // stable seat id t0..t5
  playerId: string | null;
  label: string; // jersey or position number
  slot: number; // 1-6
  x: number;
  y: number;
}

interface Bench {
  id: string;
  label: string;
  name: string;
}

export default function RotationSimulator() {
  const { profile } = useAuth();
  const teamId = profile?.teamId ?? null;
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [bench, setBench] = useState<Bench[]>([]);
  const [selected, setSelected] = useState<string | null>(null); // selected court token id
  const [animate, setAnimate] = useState(false);
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build initial line-up from the roster (players first, by jersey).
  useEffect(() => {
    if (!teamId) return;
    getTeamMembers(teamId).then((members) => {
      const players = (members as UserProfile[])
        .filter((m) => m.role === "player")
        .sort((a, b) => (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999));
      const seats: Token[] = [];
      for (let i = 0; i < 6; i++) {
        const slot = i + 1;
        const p = players[i];
        seats.push({
          id: `t${i}`,
          playerId: p?.uid ?? null,
          label: p?.jerseyNumber != null ? String(p.jerseyNumber) : String(slot),
          slot,
          x: SLOT_BASE[slot].x,
          y: SLOT_BASE[slot].y,
        });
      }
      setTokens(seats);
      setBench(
        players.slice(6).map((p) => ({
          id: p.uid,
          label: p.jerseyNumber != null ? String(p.jerseyNumber) : p.displayName.slice(0, 2),
          name: p.displayName,
        })),
      );
      setLoading(false);
    });
  }, [teamId]);

  useEffect(() => () => { if (animTimer.current) clearTimeout(animTimer.current); }, []);

  const slotToId = useMemo(() => {
    const m: Record<number, string> = {};
    tokens.forEach((t) => (m[t.slot] = t.id));
    return m;
  }, [tokens]);

  const faults = useMemo(() => {
    const pos: Record<number, Pt> = {};
    tokens.forEach((t) => (pos[t.slot] = { x: t.x, y: t.y }));
    return detectFaults(pos);
  }, [tokens]);

  const faultPairs = useMemo<[string, string][]>(
    () => faults.map((f) => [slotToId[f.a], slotToId[f.b]] as [string, string]),
    [faults, slotToId],
  );

  function moveToken(id: string, x: number, y: number) {
    setAnimate(false);
    setTokens((ts) => ts.map((t) => (t.id === id ? { ...t, x, y } : t)));
  }

  function withAnimation(update: () => void) {
    setAnimate(true);
    update();
    if (animTimer.current) clearTimeout(animTimer.current);
    animTimer.current = setTimeout(() => setAnimate(false), 500);
  }

  function rotate(dir: "next" | "prev") {
    withAnimation(() => {
      setTokens((ts) => {
        const slotOf: Record<string, number> = {};
        ts.forEach((t) => (slotOf[t.id] = t.slot));
        const next = rotateSlots(slotOf, dir);
        return ts.map((t) => {
          const slot = next[t.id];
          return { ...t, slot, x: SLOT_BASE[slot].x, y: SLOT_BASE[slot].y };
        });
      });
    });
  }

  function applyPreset(preset: Record<number, Pt>) {
    withAnimation(() => {
      setTokens((ts) =>
        ts.map((t) => ({ ...t, x: preset[t.slot].x, y: preset[t.slot].y })),
      );
    });
  }

  // Substitute the selected court token with a bench player (swap).
  function substitute(benchPlayer: Bench) {
    if (!selected) return;
    setTokens((ts) =>
      ts.map((t) =>
        t.id === selected
          ? { ...t, playerId: benchPlayer.id, label: benchPlayer.label }
          : t,
      ),
    );
    const replaced = tokens.find((t) => t.id === selected);
    setBench((b) => {
      const without = b.filter((x) => x.id !== benchPlayer.id);
      if (replaced?.playerId) {
        without.push({ id: replaced.playerId, label: replaced.label, name: replaced.label });
      }
      return without;
    });
    setSelected(null);
  }

  if (loading) return <FullScreenLoader />;

  const courtPlayers = tokens.map((t) => ({
    id: t.id,
    label: t.label,
    team: "ours" as const,
  }));
  const positions = Object.fromEntries(tokens.map((t) => [t.id, { x: t.x, y: t.y }]));

  return (
    <div className="space-y-4">
      {/* fault warning */}
      {faults.length > 0 ? (
        <div className="rounded-2xl bg-red-50 p-3 ring-1 ring-red-200">
          <p className="text-sm font-bold text-red-700">⚠️ ポジショナルフォールト</p>
          <ul className="mt-1 space-y-0.5">
            {faults.map((f, i) => (
              <li key={i} className="text-xs text-red-600">
                ・{f.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
          ✓ 正しい配置（反則なし）
        </div>
      )}

      <div className="card">
        <CourtCanvas
          players={courtPlayers}
          positions={positions}
          onMove={moveToken}
          faults={faultPairs}
          animate={animate}
        />
        <p className="mt-2 text-center text-xs text-slate-400">
          選手を指でドラッグして配置。番号はポジション番号(1〜6)です。
        </p>
      </div>

      {/* controls */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => rotate("prev")} className="btn-ghost">
          ↺ ローテ戻す
        </button>
        <button onClick={() => rotate("next")} className="btn-primary">
          ローテ進む ↻
        </button>
        <button onClick={() => applyPreset(SLOT_RECEIVE)} className="btn-ghost">
          レセプション隊形
        </button>
        <button onClick={() => applyPreset(SLOT_BASE)} className="btn-ghost">
          基本配置にリセット
        </button>
      </div>

      {/* substitution */}
      <div className="card">
        <p className="text-sm font-bold text-slate-700">交代（控えメンバー）</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {selected
            ? "交代する控え選手をタップ"
            : "コートの選手をタップ → 控え選手をタップで交代"}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {tokens.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(selected === t.id ? null : t.id)}
              className={`chip ring-1 transition ${
                selected === t.id
                  ? "bg-brand-600 text-white ring-brand-600"
                  : "bg-white text-slate-600 ring-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="mt-3 border-t border-slate-100 pt-3">
          {bench.length === 0 ? (
            <p className="text-xs text-slate-400">控えメンバーがいません。</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {bench.map((b) => (
                <button
                  key={b.id}
                  disabled={!selected}
                  onClick={() => substitute(b)}
                  className="chip bg-slate-100 text-slate-700 ring-1 ring-slate-200 disabled:opacity-40"
                >
                  {b.label} {b.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
