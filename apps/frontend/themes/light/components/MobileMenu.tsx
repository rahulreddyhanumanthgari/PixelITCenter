"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { nav, site } from "@/content/site";

/** Phones and tablets: a panel that drops down under the header. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="light-mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="grid size-11 place-items-center rounded-md text-ink"
      >
        {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
      </button>

      {open && (
        <nav
          id="light-mobile-nav"
          aria-label="Mobile"
          className="absolute inset-x-0 top-full max-h-[calc(100svh-4rem)] overflow-y-auto border-b border-line bg-paper px-4 pb-8 pt-2 shadow-[0_24px_48px_-24px_rgb(16_42_46/0.25)] sm:px-6"
        >
          <ul>
            {nav.map((item) => (
              <li key={item.label} className="border-b border-line last:border-b-0">
                <a href={item.href} onClick={() => setOpen(false)} className="block py-4 font-display text-2xl font-semibold tracking-[-0.02em]">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <a href={site.portalUrl} className="l-btn l-btn--secondary mt-6 w-full sm:hidden">
            Portal login
          </a>
        </nav>
      )}
    </div>
  );
}
