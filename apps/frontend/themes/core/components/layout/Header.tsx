import { ArrowRight } from "lucide-react";
import { site } from "@/content/site";
import { buttonVariants } from "@/themes/core/components/ui/button";
import { cn } from "@/lib/utils";
import { HeaderShell } from "./HeaderShell";
import { Logo } from "./Logo";
import { NavLinks } from "./NavLinks";
import { MobileMenu } from "./MobileMenu";

export function Header() {
  return (
    <HeaderShell>
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
        <a href="#top" className="rounded-md" aria-label={`${site.name} home`}>
          <Logo priority alt="" />
        </a>

        <nav aria-label="Main" className="hidden lg:block">
          <NavLinks />
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={site.portalUrl}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "cta-pill hidden rounded-full sm:inline-flex",
            )}
          >
            Portal Login
            <ArrowRight aria-hidden="true" />
          </a>
          <MobileMenu />
        </div>
      </div>
    </HeaderShell>
  );
}
