import type { Metadata, Viewport } from "next";
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
            <AuthProvider>{children}</AuthProvider>
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
