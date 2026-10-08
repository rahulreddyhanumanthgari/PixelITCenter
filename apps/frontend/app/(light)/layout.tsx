import type { Metadata, Viewport } from "next";
import { Sofia_Sans_Extra_Condensed } from "next/font/google";
import { DesignSwitch } from "@/components/DesignSwitch";
import { siteMetadata } from "@/lib/metadata";
import { fontVariables } from "@/themes/core/fonts";
import "@/themes/core/core.css";
import "@/themes/light/light.css";

// Root layout for the light version: the same site (themes/core) in the
// light colours (themes/light). app/(dark) is the dark version; see
// lib/design.ts for how one is chosen.

// Light typography (the owner's landing-page reference): headings in a heavy
// extra-condensed face; text stays Inter (fonts.ts).
const headline = Sofia_Sans_Extra_Condensed({ variable: "--font-headline", subsets: ["latin"], weight: ["800", "900"] });

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  themeColor: "#f8fafc",
  colorScheme: "light",
};

export default function LightLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" className={`${fontVariables} ${headline.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <DesignSwitch current="light" />
      </body>
    </html>
  );
}
