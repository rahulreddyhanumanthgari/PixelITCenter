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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
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
              "hidden h-9 rounded-full border-foreground/20 bg-transparent px-4 sm:inline-flex",
            )}
          >
            Portal Login
          </a>
          <MobileMenu />
        </div>
      </div>
    </HeaderShell>
  );
}
