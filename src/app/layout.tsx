import type { Metadata } from "next";
import { NavTracker } from "@/components/back-button";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "TomatoSky - Rooted in Lebanon", template: "%s | TomatoSky" },
  description: "TOMATO SKY SAL. A home for food and agricultural brands in Lebanon, including VirginValley and Black Beauty Tomato.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body><NavTracker />{children}</body></html>;
}
