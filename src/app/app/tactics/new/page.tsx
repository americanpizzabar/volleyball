"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import TacticEditor, { type TacticDraft } from "@/components/tactics/TacticEditor";
import { createTactic } from "@/lib/firebase/db";
import { PageHeader } from "@/components/ui";

export default function NewTacticPage() {
  const { profile } = useAuth();
  const router = useRouter();

  if (profile && profile.role !== "coach") {
    return (
      <p className="card text-sm text-slate-500">
        ローテ図の作成は顧問・コーチのみ可能です。
      </p>
    );
  }

  async function handleSave(draft: TacticDraft) {
    if (!profile?.teamId) return;
    const id = await createTactic({
      teamId: profile.teamId,
      createdBy: profile.uid,
      ...draft,
    });
    router.replace(`/app/tactics/${id}`);
  }

  return (
    <div>
      <PageHeader title="ローテ図を作成" subtitle="選手をドラッグして配置・動きを作る" />
      <TacticEditor onSave={handleSave} />
    </div>
  );
}
