"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getTeamMembers, updateMember, updateProfile } from "@/lib/db";
import {
  POSITION_LABELS,
  ROLE_LABELS,
  type Position,
  type UserProfile,
} from "@/lib/types";
import { FullScreenLoader, PageHeader, Spinner } from "@/components/ui";
import QRCodeImage from "@/components/QRCodeImage";

export default function ProfilePage() {
  const { profile, team, logout, updatePassword } = useAuth();
  const router = useRouter();
  const isCoach = profile?.role === "coach";

  const [displayName, setDisplayName] = useState("");
  const [jersey, setJersey] = useState("");
  const [position, setPosition] = useState<Position | "">("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [copied, setCopied] = useState(false);
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const inviteUrl = team ? `${origin}/join/${team.inviteCode}` : "";

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
    await updateProfile({
      displayName: displayName.trim() || profile.displayName,
      jerseyNumber: jersey ? Number(jersey) : null,
      position: position || null,
    });
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

  async function changeMember(
    uid: string,
    data: { role?: UserProfile["role"]; squad?: "A" | "B" | null },
  ) {
    setMembers((prev) => prev.map((m) => (m.uid === uid ? { ...m, ...data } : m)));
    try {
      await updateMember(uid, data);
    } catch {
      // 失敗時は再取得して整合
      if (profile?.teamId) getTeamMembers(profile.teamId).then((m) => setMembers(m as UserProfile[]));
    }
  }

  async function copyInviteUrl() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 1500);
    } catch {
      /* clipboard may be blocked; URL is shown on screen */
    }
  }

  async function shareInvite() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "サク戦 参加リンク",
          text: `${team?.name ?? "チーム"}に参加しよう`,
          url: inviteUrl,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      copyInviteUrl();
    }
  }

  async function handleChangePassword() {
    if (newPw.length < 6) {
      setPwMsg("6文字以上で入力してください。");
      return;
    }
    setPwBusy(true);
    setPwMsg("");
    try {
      await updatePassword(curPw, newPw);
      setCurPw("");
      setNewPw("");
      setPwMsg("変更しました ✓");
      setTimeout(() => setPwMsg(""), 2500);
    } catch {
      setPwMsg("変更に失敗しました。現在のパスワードをご確認ください。");
    }
    setPwBusy(false);
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
            部員・マネージャーは下のQR/リンクから、コード入力なしで参加できます。
          </p>

          {/* invite link + QR */}
          <div className="mt-4 flex flex-col items-center gap-3 border-t border-slate-100 pt-4">
            <QRCodeImage value={inviteUrl} size={176} />
            <p className="break-all text-center text-xs text-slate-500">{inviteUrl}</p>
            <div className="flex w-full gap-2">
              <button onClick={copyInviteUrl} className="btn-ghost flex-1 text-xs">
                {copiedUrl ? "コピー✓" : "リンクをコピー"}
              </button>
              <button onClick={shareInvite} className="btn-primary flex-1 text-xs">
                共有する
              </button>
            </div>
          </div>
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

      {/* password change (no email needed) */}
      <div className="card space-y-3">
        <p className="text-sm font-bold text-slate-700">パスワード変更</p>
        <p className="text-xs text-slate-500">
          メール不要。現在のパスワードと新しいパスワードを入力して変更できます。
        </p>
        <input
          type="password"
          className="input"
          placeholder="現在のパスワード"
          autoComplete="current-password"
          value={curPw}
          onChange={(e) => setCurPw(e.target.value)}
        />
        <input
          type="password"
          className="input"
          placeholder="新しいパスワード（6文字以上）"
          autoComplete="new-password"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
        />
        {pwMsg && (
          <p
            className={`text-sm ${
              pwMsg.includes("✓") ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {pwMsg}
          </p>
        )}
        <button
          onClick={handleChangePassword}
          disabled={pwBusy || !newPw || !curPw}
          className="btn-ghost w-full"
        >
          {pwBusy ? <Spinner /> : "パスワードを変更"}
        </button>
      </div>

      {/* members */}
      <div className="card">
        <p className="text-sm font-bold text-slate-700">
          メンバー（{members.length}人）
        </p>
        {isCoach && (
          <p className="mt-0.5 text-xs text-slate-500">
            役割とA/Bチームを割り当てられます。
          </p>
        )}
        <ul className="mt-3 divide-y divide-slate-100">
          {members.map((m) => (
            <li key={m.uid} className="flex items-center justify-between gap-2 py-2">
              <div className="flex min-w-0 items-center gap-2">
                {m.jerseyNumber != null && (
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    {m.jerseyNumber}
                  </span>
                )}
                <span className="truncate text-sm font-medium text-slate-800">{m.displayName}</span>
                {m.squad && (
                  <span className={`chip shrink-0 ${m.squad === "A" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                    {m.squad}
                  </span>
                )}
              </div>
              {isCoach && m.uid !== profile.uid ? (
                <div className="flex shrink-0 gap-1">
                  <select
                    value={m.role}
                    onChange={(e) => changeMember(m.uid, { role: e.target.value as typeof m.role })}
                    className="rounded-md border border-slate-200 bg-white px-1 py-0.5 text-xs text-slate-600"
                  >
                    {(Object.keys(ROLE_LABELS) as (keyof typeof ROLE_LABELS)[]).map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                  <select
                    value={m.squad ?? ""}
                    onChange={(e) => changeMember(m.uid, { squad: (e.target.value || null) as "A" | "B" | null })}
                    className="rounded-md border border-slate-200 bg-white px-1 py-0.5 text-xs text-slate-600"
                  >
                    <option value="">—</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                  </select>
                </div>
              ) : (
                <span className="chip shrink-0 bg-slate-100 text-slate-500">{ROLE_LABELS[m.role]}</span>
              )}
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
