"use client";

import { useEffect, useState } from "react";
import { nav } from "@/content/site";

/**
 * Desktop navigation links. The section currently in view gets
 * aria-current and a small orange dot; hover is a quiet colour change.
 */
export function NavLinks() {
  const [active, setActive] = useState<string>(nav[0].href);

  useEffect(() => {
    const targets = nav
      .map((item) => ({ href: item.href, el: document.querySelector<HTMLElement>(item.href) }))
      .filter((t): t is { href: (typeof nav)[number]["href"]; el: HTMLElement } => t.el !== null);
    let frame = 0;
    const update = () => {
      frame = 0;
      // The last section whose top has passed 40% of the screen.
      const line = window.innerHeight * 0.4;
      let current: string = nav[0].href;
      for (const t of targets) if (t.el.getBoundingClientRect().top <= line) current = t.href;
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <ul className="flex items-center gap-8">
      {nav.map((item) => (
        <li key={item.label}>
          <a
            href={item.href}
            aria-current={active === item.href ? "true" : undefined}
            className="type-nav group relative rounded-sm text-[var(--text-secondary)] transition-colors duration-300 hover:text-[var(--text-primary)] aria-[current=true]:text-[var(--text-primary)]"
          >
            {item.label}
            <span
              aria-hidden="true"
              className="absolute -bottom-2.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-brand-orange opacity-0 transition-opacity duration-300 group-aria-[current=true]:opacity-100"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}
