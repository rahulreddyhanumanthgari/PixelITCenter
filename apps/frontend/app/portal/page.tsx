import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { portal } from "@/content/site";
import { Logo } from "@/themes/core/components/layout/Logo";
import { PortalLoginForm } from "@/themes/core/components/portal/PortalLoginForm";

// Portal Login, for now a page on the public site. It moves to
// portal.pixelitcenter.com later (see site.portalUrl).

export const metadata: Metadata = {
  title: portal.pageTitle,
  alternates: { canonical: "/portal" },
  robots: { index: false, follow: false },
};

export default function PortalPage() {
  return (
    <main className="portal-page flex flex-1 items-center justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="portal-back" aria-label="Back to website">
          <ArrowLeft aria-hidden="true" className="size-5" />
        </Link>
        <div className="portal-card mt-4">
          <Logo priority className="mx-auto block h-10 lg:h-11" />
          <h1 className="sr-only">{portal.pageTitle}</h1>
          <div className="mt-7">
            <PortalLoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}
