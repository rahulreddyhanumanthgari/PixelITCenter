import type { Metadata, Viewport } from "next";
import { Oswald, Sofia_Sans_Extra_Condensed } from "next/font/google";
import { DesignSwitch } from "@/components/DesignSwitch";
import { siteMetadata } from "@/lib/metadata";
import { fontVariables } from "@/themes/core/fonts";
import "@/themes/core/core.css";
import "@/themes/light/light.css";

// Root layout for the light design: the shared site (themes/core) on a white
// environment with the light material layer of the particle engine. See
// lib/design.ts for how a design is chosen.

// Tall condensed display face for headings (after the reference video).
const condensed = Oswald({
  variable: "--font-condensed",
  subsets: ["latin"],
  weight: ["600", "700"],
});
// The landing-page reference's hero headline: heavy, tightly set condensed caps.
const heroFace = Sofia_Sans_Extra_Condensed({
  variable: "--font-hero",
  subsets: ["latin"],
  weight: ["900"],
});

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function LightLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${fontVariables} ${condensed.variable} ${heroFace.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <DesignSwitch current="light" />
      </body>
    </html>
  );
}
