import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CloudScout - Cloud Intelligence by Riya",
  description: "Scout cloud cost signals across LinkedIn, FinOps communities, and competitor updates. Powered by AI for ZopNight & ZopDay.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-[#0b1120] dark:via-[#0f1729] dark:to-[#0b1120] min-h-screen transition-colors duration-300`}
      >
        <Header />
        <Sidebar />
        <main className="min-h-[calc(100vh-4rem)] pt-0 lg:pl-60">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
