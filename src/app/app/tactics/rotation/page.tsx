"use client";

import Link from "next/link";
import RotationSimulator from "@/components/tactics/RotationSimulator";
import { PageHeader } from "@/components/ui";

export default function RotationPage() {
  return (
    <div>
      <PageHeader
        title="ローテシミュレーター"
        subtitle="かぶり(反則)を自動判定・ローテ回転・交代"
      />
      <RotationSimulator />
      <Link href="/app/tactics" className="mt-4 block text-center text-sm text-slate-400">
        ← ローテ一覧に戻る
      </Link>
    </div>
  );
}
