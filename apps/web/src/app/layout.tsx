import type { Metadata } from "next";
import { cookies } from "next/headers";
import { parseUiMode, UI_MODE_COOKIE } from "@finvesting/core";
import { appPassword, isAuthed } from "../lib/app-session";
import { AppShell } from "./app-shell";
import { LoginPanel } from "./login-panel";
import { Providers } from "./providers";
import "./globals.css";
import "./shell.css";

export const metadata: Metadata = { title: "Finvesting", description: "개인 금융 업무 터미널" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const open = await isAuthed();
  const showLogout = appPassword().length > 0;
  const mode = parseUiMode((await cookies()).get(UI_MODE_COOKIE)?.value);
  return (
    <html lang="ko" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {open ? <Providers>
          <AppShell mode={mode} showLogout={showLogout}>{children}</AppShell>
        </Providers> : (
          <main className="main"><LoginPanel /></main>
        )}
      </body>
    </html>
  );
}
