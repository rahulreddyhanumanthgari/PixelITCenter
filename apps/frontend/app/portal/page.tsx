import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { portal, site } from "@/content/site";
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
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
          <Link href="/" className="rounded-md" aria-label={`${site.name} home`}>
            <Logo priority alt="" />
          </Link>
          <Link href="/" className="portal-back">
            <ArrowLeft aria-hidden="true" className="size-4" />
            <span>
              Back<span className="hidden sm:inline"> to website</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="portal-page flex flex-1 items-center justify-center px-4 pt-28 pb-16 sm:pt-32">
        <div className="portal-card w-full max-w-md">
          <h1 className="sr-only">{portal.pageTitle}</h1>
          <PortalLoginForm />
        </div>
      </main>
    </>
  );
}
