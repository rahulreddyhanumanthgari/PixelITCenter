import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, IBM_Plex_Sans } from "next/font/google";
import { DesignSwitch } from "@/components/DesignSwitch";
import { siteMetadata } from "@/lib/metadata";
import "@/themes/light/light.css";

// Root layout for the light design (themes/light). The dark design has its
// own root layout in app/(dark); see lib/design.ts for how one is chosen.

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function LightLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bricolage.variable} ${plex.variable} antialiased`}>
      <body>
        {children}
        <DesignSwitch current="light" />
      </body>
    </html>
  );
}
