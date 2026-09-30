"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { nav, site } from "@/content/site";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="relative z-50 grid size-11 place-items-center rounded-full text-foreground"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open && (
        <div id="mobile-nav" className="fixed inset-0 z-40 bg-background/97 px-6 pt-24 backdrop-blur">
          <nav aria-label="Mobile">
            <ul className="flex flex-col gap-1">
              {nav.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block py-3 font-display text-3xl font-semibold tracking-[-0.02em]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <a
            href={site.portalUrl}
            className="mt-8 inline-flex h-12 items-center rounded-full border border-foreground/20 px-6 text-sm font-medium"
          >
            Portal Login
          </a>
        </div>
      )}
    </div>
  );
}
