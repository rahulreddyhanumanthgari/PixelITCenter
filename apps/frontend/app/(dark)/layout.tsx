import type { Metadata, Viewport } from "next";
import { DesignSwitch } from "@/components/DesignSwitch";
import { siteMetadata } from "@/lib/metadata";
import { fontVariables } from "@/themes/core/fonts";
import "@/themes/core/core.css";
import "@/themes/dark/dark.css";

// Root layout for the dark version: the site (themes/core) in the dark
// colours (themes/dark). app/(light) is the light version; see lib/design.ts
// for how one is chosen.

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  themeColor: "#05060a",
  colorScheme: "dark",
};

export default function DarkLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" className={`dark ${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <DesignSwitch current="dark" />
      </body>
    </html>
  );
}
