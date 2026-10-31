import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MumiasGIS — AI-Powered Mobile GIS",
  description:
    "AI-powered web-based Mobile GIS centred in Mumias, Kenya. Determine optimal routes and overlay live traffic and weather data.",
  keywords: ["GIS", "Mumias", "Kenya", "routing", "maps", "traffic", "weather", "navigation"],
  authors: [{ name: "MumiasGIS" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-slate-950 text-white`}
      >
        {children}
      </body>
    </html>
  );
}
