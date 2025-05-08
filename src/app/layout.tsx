import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Narrator - 智能叙事助手",
  description: "基于先进AI技术的智能叙事和对话助手",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className} style={{ background: '#fafafa' }}>
        <Providers>
          <main className="min-h-screen">{children}</main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
