import type { Metadata, Viewport } from "next";
import { DesignSwitch } from "@/components/DesignSwitch";
import { siteMetadata } from "@/lib/metadata";
import { fontVariables } from "@/themes/core/fonts";
import "@/themes/core/core.css";
import "@/themes/light/light.css";

// Root layout for the light design: the shared site (themes/core) in
// daylight (themes/light), with its one blue object (themes/light/ribbon). See lib/design.ts for
// how a design is chosen.

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  themeColor: "#f8fafc",
  colorScheme: "light",
};

export default function LightLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <DesignSwitch current="light" />
      </body>
    </html>
  );
}
