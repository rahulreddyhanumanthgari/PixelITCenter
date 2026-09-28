import { nav, site } from "@/content/site";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HeaderShell } from "./HeaderShell";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";

export function Header() {
  return (
    <HeaderShell>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
        <a href="#top" className="rounded-md" aria-label={`${site.name} home`}>
          <Logo />
        </a>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-8 text-sm text-muted-foreground">
            {nav.map((item) => (
              <li key={item.label}>
                <a href={item.href} className="rounded-sm transition-colors hover:text-foreground">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={site.portalUrl}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "hidden h-9 rounded-full border-white/20 bg-transparent px-4 sm:inline-flex",
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
