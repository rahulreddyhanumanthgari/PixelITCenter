import type { Metadata, Viewport } from "next";
import { Sofia_Sans_Extra_Condensed } from "next/font/google";
import { siteMetadata } from "@/lib/metadata";
import { fontVariables } from "@/themes/core/fonts";
import "@/themes/core/core.css";
import "@/themes/light/light.css";

// Root layout: the site (themes/core) in the light colours (themes/light).
// data-theme="light" switches the particle engine to its light material.

// Headings in a heavy extra-condensed face (the owner's landing-page
// reference); text stays Inter (fonts.ts).
const headline = Sofia_Sans_Extra_Condensed({ variable: "--font-headline", subsets: ["latin"], weight: ["800", "900"] });

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  themeColor: "#f8fafc",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" className={`${fontVariables} ${headline.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
