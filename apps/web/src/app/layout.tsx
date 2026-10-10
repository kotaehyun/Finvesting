import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = { title: "Finvesting", description: "개인 금융 업무 터미널" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <nav className="nav">
            <a href="/">Finvesting</a>
            <a href="/timeline">타임라인</a>
            <a href="/accounts">계좌</a>
            <a href="/holdings">보유</a>
            <a href="/invest">투자</a>
            <a href="/markets">시장</a>
            <a href="/realty">부동산</a>
            <a href="/statements">재무제표</a>
            <a href="/fundamentals">Fundamentals</a>
            <a href="/profile">프로필대장</a>
            <a href="/tax">세금/연말정산</a>
            <a href="/accounting">회계전표</a>
            <a href="/news">뉴스</a>
            <a href="/opinions">오피니언</a>
            <a href="/chat">Chat</a>
          </nav>
          <main className="main">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
