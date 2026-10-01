import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { DesignSwitch } from "@/components/DesignSwitch";
import { siteMetadata } from "@/lib/metadata";
import { fontVariables } from "@/themes/core/fonts";
import "@/themes/core/core.css";
import "@/themes/light/light.css";

// Root layout for the light design: the shared site (themes/core) in
// daylight (themes/light), with no particles for now. See lib/design.ts for
// how a design is chosen.

// The light hero's type, after the owner's reference landing page.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  themeColor: "#f8fafc",
  colorScheme: "light",
};

export default function LightLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" className={`${fontVariables} ${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <DesignSwitch current="light" />
      </body>
    </html>
  );
}
