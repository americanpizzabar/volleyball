"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS } from "@/lib/types";
import { FullScreenLoader } from "./ui";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const NAV: NavItem[] = [
  { href: "/app", label: "ホーム", icon: <IconHome /> },
  { href: "/app/practices", label: "メニュー", icon: <IconClipboard /> },
  { href: "/app/tactics", label: "ローテ", icon: <IconBoard /> },
  { href: "/app/journal", label: "日誌", icon: <IconBook /> },
  { href: "/app/profile", label: "設定", icon: <IconUser /> },
];

/**
 * Wraps every authenticated page: enforces auth + onboarding, and renders the
 * mobile-first chrome (header + bottom tab bar).
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const { user, profile, team, loading, configured } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || !configured) return;
    if (!user) {
      router.replace("/login");
    } else if (profile && !profile.teamId) {
      router.replace("/onboarding");
    }
  }, [loading, configured, user, profile, router]);

  if (!configured) return <SetupNotice />;
  if (loading || !user || !profile?.teamId) return <FullScreenLoader />;

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-slate-50">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
        <Link href="/app" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-black text-white">
            S
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-900">サク戦</p>
            <p className="text-[11px] text-slate-500">{team?.name ?? ""}</p>
          </div>
        </Link>
        <div className="text-right leading-tight">
          <p className="text-xs font-semibold text-slate-700">
            {profile.displayName}
          </p>
          <p className="text-[11px] text-brand-600">{ROLE_LABELS[profile.role]}</p>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 pb-24">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-lg border-t border-slate-200 bg-white/95 backdrop-blur">
        <ul className="grid grid-cols-5">
          {NAV.map((item) => {
            const active =
              item.href === "/app"
                ? pathname === "/app"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                    active ? "text-brand-600" : "text-slate-400"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function SetupNotice() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-4xl">🛠️</div>
      <h1 className="text-lg font-bold text-slate-900">Firebaseの設定が必要です</h1>
      <p className="text-sm text-slate-500">
        <code className="rounded bg-slate-100 px-1">.env.local</code>{" "}
        にFirebaseの設定値を入力してください。手順は{" "}
        <code className="rounded bg-slate-100 px-1">README.md</code> を参照。
      </p>
    </div>
  );
}

/* --- inline icons (no external dependency) --- */
function IconHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}
function IconClipboard() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="3" width="8" height="4" rx="1" /><path d="M9 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3" /><path d="M8 12h8M8 16h6" />
    </svg>
  );
}
function IconBoard() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 12h18M12 4v16" /><circle cx="7.5" cy="8" r="1.2" fill="currentColor" stroke="none" /><circle cx="16.5" cy="16" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5.5A1.5 1.5 0 0 0 4 21.5z" /><path d="M4 19.5A1.5 1.5 0 0 1 5.5 18H20" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}
