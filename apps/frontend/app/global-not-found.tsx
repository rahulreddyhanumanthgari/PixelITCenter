import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";
import "@/themes/core/core.css";
import "@/themes/dark/dark.css";

// Shown for any URL that matches no route. Each design has its own root
// layout, so this page brings its own <html> (see next.config.ts).

export const metadata: Metadata = {
  title: `Page not found | ${site.name}`,
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="grid min-h-full place-items-center px-4 text-center">
        <main className="space-y-4">
          <h1 className="text-2xl font-semibold">This page doesn&apos;t exist</h1>
          <p className="text-[var(--text-secondary)]">Check the address, or start again from the homepage.</p>
          <Link href="/" className="inline-block underline underline-offset-4">
            Go to the homepage
          </Link>
        </main>
      </body>
    </html>
  );
}
