import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist } from "next/font/google";
import { StackProvider, StackTheme } from "@stackframe/stack";
import "./globals.css";
import { stackServerApp } from "@/stack/server";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "サク戦 | バレー部アプリ",
  description:
    "バレーボール部活のためのデジタル戦術ノート・スタッツ・ポートフォリオアプリ。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#4f46e5",
};

// Auth + DB calls require request context (cookies); skip static prerendering.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <StackProvider app={stackServerApp}>
          <StackTheme>
            {/* Stack's client hooks (useUser) bail out to client-side rendering
                during SSR; a Suspense boundary catches that so pages don't 500. */}
            <Suspense
              fallback={
                <div className="grid min-h-dvh place-items-center bg-slate-50 text-slate-400">
                  読み込み中…
                </div>
              }
            >
              <AuthProvider>{children}</AuthProvider>
            </Suspense>
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
