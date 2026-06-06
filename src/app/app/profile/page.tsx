"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { getTeamMembers } from "@/lib/db";
import {
  POSITION_LABELS,
  ROLE_LABELS,
  type Position,
  type UserProfile,
} from "@/lib/types";
import { FullScreenLoader, PageHeader, Spinner } from "@/components/ui";

export default function ProfilePage() {
  const { profile, team, logout } = useAuth();
  const router = useRouter();
  const isCoach = profile?.role === "coach";

  const [displayName, setDisplayName] = useState("");
  const [jersey, setJersey] = useState("");
  const [position, setPosition] = useState<Position | "">("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setJersey(profile.jerseyNumber ? String(profile.jerseyNumber) : "");
      setPosition(profile.position ?? "");
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.teamId) {
      getTeamMembers(profile.teamId).then((m) => setMembers(m as UserProfile[]));
    }
  }, [profile?.teamId]);

  if (!profile) return <FullScreenLoader />;

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || profile.displayName,
        jersey_number: jersey ? Number(jersey) : null,
        position: position || null,
      })
      .eq("id", profile.uid);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function copyCode() {
    if (!team) return;
    try {
      await navigator.clipboard.writeText(team.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked; code is shown on screen anyway */
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/");
  }

  return (
    <div className="space-y-5">
      <PageHeader title="設定" subtitle={ROLE_LABELS[profile.role]} />

      {/* invite code (coach can share) */}
      {team && (
        <div className="card">
          <p className="text-xs font-semibold text-slate-500">チーム招待コード</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-center text-2xl font-black tracking-[0.3em] text-slate-800">
              {team.inviteCode}
            </span>
            <button onClick={copyCode} className="btn-ghost px-3 py-2.5 text-xs">
              {copied ? "コピー✓" : "コピー"}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            このコードを部員・マネージャーに共有すると、チームに参加できます。
          </p>
        </div>
      )}

      {/* profile editing */}
      <div className="card space-y-3">
        <p className="text-sm font-bold text-slate-700">プロフィール</p>
        <div>
          <label className="label">名前</label>
          <input
            className="input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <div className="w-28">
            <label className="label">背番号</label>
            <input
              type="number"
              className="input"
              value={jersey}
              onChange={(e) => setJersey(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="label">ポジション</label>
            <select
              className="input"
              value={position}
              onChange={(e) => setPosition(e.target.value as Position | "")}
            >
              <option value="">未設定</option>
              {(Object.keys(POSITION_LABELS) as Position[]).map((p) => (
                <option key={p} value={p}>
                  {POSITION_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
          {saving ? <Spinner /> : saved ? "保存しました ✓" : "保存"}
        </button>
      </div>

      {/* members */}
      <div className="card">
        <p className="text-sm font-bold text-slate-700">
          メンバー（{members.length}人）
        </p>
        <ul className="mt-3 divide-y divide-slate-100">
          {members.map((m) => (
            <li key={m.uid} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                {m.jerseyNumber != null && (
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    {m.jerseyNumber}
                  </span>
                )}
                <span className="text-sm font-medium text-slate-800">{m.displayName}</span>
              </div>
              <span className="chip bg-slate-100 text-slate-500">{ROLE_LABELS[m.role]}</span>
            </li>
          ))}
        </ul>
      </div>

      <button onClick={handleLogout} className="btn-ghost w-full text-red-600">
        ログアウト
      </button>
      {!isCoach && (
        <p className="pb-2 text-center text-xs text-slate-400">
          チームを移りたい場合は顧問に連絡してください。
        </p>
      )}
    </div>
  );
}
