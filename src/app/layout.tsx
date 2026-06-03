import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SHURA — Reveal what to build",
  description:
    "Paste a YouTube URL or Reddit topic. Get trend analysis, 3 ranked product ideas, and a full product spec in under 60 seconds.",
  openGraph: {
    title: "SHURA",
    description: "Turn social content into product opportunities.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
