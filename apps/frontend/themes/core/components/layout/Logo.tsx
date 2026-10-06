import Image from "next/image";
import { site } from "@/content/site";
import { cn } from "@/lib/utils";
import logo from "@/public/brand/pixel-it-center-logo.webp";
import logoLight from "@/public/brand/pixel-it-center-logo-light.webp";

interface LogoProps {
  className?: string;
  /** Load eagerly (the header logo is visible on first paint). */
  priority?: boolean;
  /** Empty when a parent link already names it (e.g. "Pixel IT Center home"). */
  alt?: string;
}

/**
 * The Pixel IT Center logo, taken from the current pixelitcenter.com. The
 * light design shows its recoloured version (orange mark, navy "PIXELIT",
 * cyan "CENTER", as in the landing-page reference); each design's CSS shows
 * one of the two (.logo-dark / .logo-light).
 */
export function Logo({
  className,
  priority = false,
  alt = site.name,
}: LogoProps) {
  // Served as-is: small lossless WebPs at 2x+ the display size, so they stay
  // crisp on high-density screens.
  return (
    <>
      <Image
        src={logo}
        alt={alt}
        priority={priority}
        unoptimized
        className={cn("logo-dark h-10 w-auto lg:h-12", className)}
      />
      <Image
        src={logoLight}
        alt={alt}
        priority={priority}
        unoptimized
        className={cn("logo-light h-10 w-auto lg:h-12", className)}
      />
    </>
  );
}
