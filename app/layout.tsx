import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ExamGPT - Yapay Zeka Öğrenme Asistanı",
  description:
    "Tüm dersler için sınav hazırlığı, ödev yardımı ve çalışma soruları için yapay zeka destekli öğrenme asistanı",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
