"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useDoc } from "@/lib/useDoc";
import { mapTactic, updateTactic } from "@/lib/db";
import TacticEditor, { type TacticDraft } from "@/components/tactics/TacticEditor";
import { EmptyState, FullScreenLoader, PageHeader } from "@/components/ui";
import type { Tactic } from "@/lib/types";

export default function EditTacticPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const { data: tactic, loading } = useDoc<Tactic>("tactics", params.id, mapTactic);

  if (loading) return <FullScreenLoader />;
  if (!tactic) return <EmptyState icon="🔍" title="ローテ図が見つかりません" />;
  if (profile && profile.role !== "coach") {
    return <p className="card text-sm text-slate-500">編集は顧問・コーチのみ可能です。</p>;
  }

  async function handleSave(draft: TacticDraft) {
    await updateTactic(params.id, draft);
    router.replace(`/app/tactics/${params.id}`);
  }

  return (
    <div>
      <PageHeader title="ローテ図を編集" />
      <TacticEditor initial={tactic} onSave={handleSave} />
    </div>
  );
}
