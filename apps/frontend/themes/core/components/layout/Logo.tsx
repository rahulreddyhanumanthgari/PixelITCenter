import Image from "next/image";
import { site } from "@/content/site";
import { cn } from "@/lib/utils";
import logo from "@/public/brand/pixel-it-center-logo.webp";

interface LogoProps {
  className?: string;
  /** Load eagerly (the header logo is visible on first paint). */
  priority?: boolean;
  /** Empty when a parent link already names it (e.g. "Pixel IT Center home"). */
  alt?: string;
}

/** The Pixel IT Center logo, taken from the current pixelitcenter.com. */
export function Logo({
  className,
  priority = false,
  alt = site.name,
}: LogoProps) {
  return (
    <Image
      src={logo}
      alt={alt}
      priority={priority}
      // Served as-is: already a small lossless WebP at 2x+ the display size,
      // so it stays crisp on high-density screens.
      unoptimized
      className={cn("h-10 w-auto lg:h-12", className)}
    />
  );
}
