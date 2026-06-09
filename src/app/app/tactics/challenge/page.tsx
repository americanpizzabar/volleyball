"use client";

import Link from "next/link";
import RotationChallenge from "@/components/tactics/RotationChallenge";
import { PageHeader } from "@/components/ui";

export default function ChallengePage() {
  return (
    <div>
      <PageHeader title="ローテ・マスター・チャレンジ" subtitle="かぶりを直してPERFECTを狙え！" />
      <RotationChallenge />
      <Link href="/app/tactics" className="mt-4 block text-center text-sm text-slate-400">
        ← ローテ一覧に戻る
      </Link>
    </div>
  );
}
