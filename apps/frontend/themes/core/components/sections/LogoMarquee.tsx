"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

interface Logo {
  name: string;
  src: string;
}

/**
 * Continuously scrolling logo strip. The strip never pauses: the tile under
 * the pointer grows, and as tiles slide under a still pointer the next one
 * grows in turn. CSS :hover can't do that — browsers only re-check hover when
 * the mouse moves — so the tile under the pointer is found every frame while
 * the pointer is over the strip.
 */
export function LogoMarquee({ logos }: { logos: readonly Logo[] }) {
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;

    let pointer: { x: number; y: number } | null = null;
    let active: HTMLElement | null = null;
    let frame = 0;

    const setActive = (tile: HTMLElement | null) => {
      if (tile === active) return;
      active?.removeAttribute("data-active");
      tile?.setAttribute("data-active", "");
      active = tile;
    };

    const tick = () => {
      if (!pointer) return;
      const hit = document.elementFromPoint(pointer.x, pointer.y);
      const tile = hit?.closest<HTMLElement>("[data-logo-tile]") ?? null;
      setActive(tile && strip.contains(tile) ? tile : null);
      frame = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const starting = pointer === null;
      pointer = { x: e.clientX, y: e.clientY };
      if (starting) frame = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      pointer = null;
      cancelAnimationFrame(frame);
      setActive(null);
    };

    strip.addEventListener("pointermove", onMove);
    strip.addEventListener("pointerleave", onLeave);
    return () => {
      strip.removeEventListener("pointermove", onMove);
      strip.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={stripRef}
      // Vertical padding leaves room for a grown tile inside overflow-hidden.
      className="relative mt-4 overflow-hidden py-6 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] motion-reduce:[mask-image:none]"
    >
      <div className="flex w-max animate-[marquee_60s_linear_infinite] gap-4 motion-reduce:w-full motion-reduce:animate-none">
        <LogoList logos={logos} />
        {/* Second copy makes the loop seamless; hidden from screen readers. */}
        <LogoList logos={logos} decorative />
      </div>
    </div>
  );
}

function LogoList({
  logos,
  decorative = false,
}: {
  logos: readonly Logo[];
  decorative?: boolean;
}) {
  return (
    <ul
      aria-hidden={decorative || undefined}
      className={
        decorative
          ? "flex gap-4 motion-reduce:hidden"
          : "flex gap-4 motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-6 motion-reduce:px-4"
      }
    >
      {logos.map((logo) => (
        <li key={logo.name} className="shrink-0">
          {/* Light tile: several logos have dark lettering or their own solid
              box, so they can't sit directly on the dark page. */}
          <div
            data-logo-tile
            className="relative grid h-16 w-32 place-items-center rounded-xl bg-white px-3 transition-[transform,box-shadow] duration-300 ease-out data-active:z-10 data-active:scale-[1.28] data-active:shadow-[0_12px_40px_-8px_rgb(59_124_255/0.45)] sm:h-20 sm:w-40"
          >
            <Image
              src={logo.src}
              alt={decorative ? "" : logo.name}
              width={300}
              height={150}
              sizes="160px"
              // Eager: tiles slide in from off-screen, so lazy loading would show blanks.
              loading="eager"
              className="pointer-events-none h-auto max-h-full w-full object-contain"
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
