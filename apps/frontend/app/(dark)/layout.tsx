import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { DesignSwitch } from "@/components/DesignSwitch";
import { siteMetadata } from "@/lib/metadata";
import { THEME_SCRIPT } from "@/lib/theme-script";
import "@/themes/dark/dark.css";

// Root layout for the dark design (themes/dark). The light design has its
// own root layout in app/(light); see lib/design.ts for how one is chosen.

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Display face for headings: a modern grotesk with an editorial character.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#05060a" },
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
  ],
  colorScheme: "dark light",
};

export default function DarkLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`dark ${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <head>
        {/* Applies a saved light theme before first paint (no dark flash). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <DesignSwitch current="dark" />
      </body>
    </html>
  );
}
