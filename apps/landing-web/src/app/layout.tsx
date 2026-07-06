import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import QueryProvider from "../providers/QueryProvider";

// Centralized layout for landing-web page
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
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
    <html lang="id" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
