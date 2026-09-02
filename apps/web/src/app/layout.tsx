import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = { title: "Finvesting", description: "개인 금융 업무 터미널" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <nav className="nav">
            <a href="/">Finvesting</a>
            <a href="/chat">Chat</a>
          </nav>
          <main className="main">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
