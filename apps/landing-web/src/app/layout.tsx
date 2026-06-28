import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Centralized layout for landing-web page
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BIDKU - Platform Lelang Digital Terpercaya",
  description: "Dapatkan kendaraan impian dan aset berkualitas melalui sistem lelang BIDKU yang aman, terintegrasi secara nasional, dan mudah diikuti.",
  keywords: ["lelang", "lelang mobil", "lelang motor", "bidku", "indo lelang", "lelang digital"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
