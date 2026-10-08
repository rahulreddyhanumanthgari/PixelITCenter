import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";

// Shown for any URL that matches no route (inside the root layout).

export const metadata: Metadata = {
  title: `Page not found | ${site.name}`,
};

export default function NotFound() {
  return (
    <main className="grid flex-1 place-items-center px-4 text-center">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">This page doesn&apos;t exist</h1>
        <p className="text-[var(--text-secondary)]">Check the address, or start again from the homepage.</p>
        <Link href="/" className="inline-block underline underline-offset-4">
          Go to the homepage
        </Link>
      </div>
    </main>
  );
}
