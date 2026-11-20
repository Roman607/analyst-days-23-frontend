import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Analyst Days 23 · Персональная траектория", template: "%s · Analyst Days 23" },
  description: "Соберите очный маршрут Analyst Days 23 на 20–21 ноября и скачайте его на телефон.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <header className="border-b border-line">
          <div className="page-width flex min-h-16 items-center justify-between gap-4">
            <Link href="/" className="brand flex shrink-0 items-center gap-2.5 font-bold" aria-label="Analyst Days 23, главная">
              <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
              <span>Analyst Days <span className="font-medium text-accent">/ 23</span></span>
            </Link>
            <span className="text-right font-mono text-xs text-muted sm:text-sm">20–21 ноября 2026 · МСК</span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
