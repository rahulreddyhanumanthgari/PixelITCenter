import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/lib/utils";

type CardProps<T extends ElementType> = {
  as?: T;
  /** "default" | "featured" — the same card family, a little more presence. */
  variant?: "default" | "featured";
  /** The card represents the current state (e.g. the active process step). */
  active?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

/**
 * The one card used across the site (styles: `.card` in styles/globals.css).
 * Sections pick the element and the internal layout; the surface, border,
 * radius, accent, depth, hover and active state always come from here.
 * Put `card-title` on the card's heading and `card-index` on its number.
 */
export function Card<T extends ElementType = "div">({ as, variant = "default", active, className, ...props }: CardProps<T>) {
  // The element varies; its props are checked at the call site (CardProps).
  const Tag = (as ?? "div") as "div";
  return (
    <Tag
      className={cn("card", variant === "featured" && "card--featured", className as string | undefined)}
      data-active={active === undefined ? undefined : String(active)}
      {...(props as ComponentPropsWithoutRef<"div">)}
    />
  );
}
