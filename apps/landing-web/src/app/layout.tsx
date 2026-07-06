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
  metadataBase: new URL("https://bidku.co.id"),
  title: "BIDKU - Platform Lelang Digital Terpercaya",
  description: "Dapatkan kendaraan impian dan aset berkualitas melalui sistem lelang BIDKU yang aman, terintegrasi secara nasional, dan mudah diikuti.",
  keywords: ["lelang", "lelang mobil", "lelang motor", "bidku", "indo lelang", "lelang digital"],
  openGraph: {
    title: "BIDKU - Platform Lelang Digital Terpercaya",
    description: "Dapatkan kendaraan impian dan aset berkualitas melalui sistem lelang BIDKU yang aman, terintegrasi secara nasional, dan mudah diikuti.",
    url: "https://bidku.co.id",
    siteName: "BIDKU",
    images: [
      {
        url: "/Kantor_bidku.png",
        width: 1200,
        height: 630,
        alt: "Kantor BIDKU Lelang Digital",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BIDKU - Platform Lelang Digital Terpercaya",
    description: "Dapatkan kendaraan impian dan aset berkualitas melalui sistem lelang BIDKU yang aman, terintegrasi secara nasional, dan mudah diikuti.",
    images: ["/Kantor_bidku.png"],
  },
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
