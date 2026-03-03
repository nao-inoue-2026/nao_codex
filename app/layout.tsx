import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Approach List Builder",
  description: "SaaS企業向けアプローチリスト作成MVP"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
