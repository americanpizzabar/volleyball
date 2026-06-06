"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getTeamMembers } from "@/lib/db";
import { POSITION_LABELS, type UserProfile } from "@/lib/types";
import SkillSheet from "@/components/portfolio/SkillSheet";
import VideoSection from "@/components/portfolio/VideoSection";
import GoalSection from "@/components/portfolio/GoalSection";
import { FullScreenLoader, PageHeader } from "@/components/ui";

type Section = "skills" | "videos" | "goals";

const SECTIONS: { key: Section; label: string }[] = [
  { key: "skills", label: "スキル" },
  { key: "videos", label: "動画" },
  { key: "goals", label: "目標" },
];

export default function PortfolioPage() {
  const { profile } = useAuth();
  const teamId = profile?.teamId ?? null;
  const isCoach = profile?.role === "coach";

  const [members, setMembers] = useState<UserProfile[]>([]);
  const [targetUid, setTargetUid] = useState<string>("");
  const [section, setSection] = useState<Section>("skills");

  useEffect(() => {
    if (!teamId) return;
    getTeamMembers(teamId).then((m) => setMembers(m as UserProfile[]));
  }, [teamId]);

  useEffect(() => {
    if (profile && !targetUid) setTargetUid(profile.uid);
  }, [profile, targetUid]);

  const players = useMemo(
    () => members.filter((m) => m.role === "player").sort((a, b) => (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999)),
    [members],
  );

  const target = useMemo(
    () => members.find((m) => m.uid === targetUid) ?? profile ?? null,
    [members, targetUid, profile],
  );

  if (!profile || !teamId || !target) return <FullScreenLoader />;

  const isOwn = target.uid === profile.uid;
  const canEditSelf = isOwn;
  const canEditCoach = isCoach;

  return (
    <div>
      <PageHeader title="ポートフォリオ" subtitle="課題と成長を可視化" />

      {/* Member selector for coach */}
      {isCoach && players.length > 0 && (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          <Chip active={targetUid === profile.uid} onClick={() => setTargetUid(profile.uid)}>
            自分
          </Chip>
          {players.map((p) => (
            <Chip key={p.uid} active={targetUid === p.uid} onClick={() => setTargetUid(p.uid)}>
              {p.jerseyNumber != null ? `${p.jerseyNumber} ` : ""}
              {p.displayName}
            </Chip>
          ))}
        </div>
      )}

      {/* Target header */}
      <div className="card mb-4 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-lg font-black text-brand-700">
          {target.jerseyNumber ?? target.displayName.slice(0, 1)}
        </div>
        <div>
          <p className="font-bold text-slate-900">{target.displayName}</p>
          <p className="text-xs text-slate-500">
            {target.position ? POSITION_LABELS[target.position] : "ポジション未設定"}
          </p>
        </div>
      </div>

      {/* Section tabs */}
      <div className="mb-4 grid grid-cols-3 gap-1.5">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={`rounded-xl py-2 text-sm font-semibold ring-1 transition ${
              section === s.key
                ? "bg-brand-600 text-white ring-brand-600"
                : "bg-white text-slate-600 ring-slate-200"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === "skills" && (
        <SkillSheet
          targetUid={target.uid}
          teamId={teamId}
          position={target.position ?? null}
          canEditSelf={canEditSelf}
          canEditCoach={canEditCoach}
        />
      )}
      {section === "videos" && (
        <VideoSection
          teamId={teamId}
          targetUid={target.uid}
          targetName={target.displayName}
          canUpload={isOwn}
          me={{ uid: profile.uid, name: profile.displayName, isCoach }}
        />
      )}
      {section === "goals" && (
        <GoalSection
          teamId={teamId}
          targetUid={target.uid}
          targetName={target.displayName}
          canEdit={isOwn || isCoach}
        />
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`chip shrink-0 ring-1 transition ${
        active ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-600 ring-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
