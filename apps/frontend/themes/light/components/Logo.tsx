import Image from "next/image";
import { site } from "@/content/site";
import { cn } from "@/lib/utils";
import logo from "@/public/brand/pixel-it-center-logo.webp";

/** The Pixel IT Center logo (teal mark and wordmark, from pixelitcenter.com). */
export function Logo({ className, priority = false, alt = site.name }: { className?: string; priority?: boolean; alt?: string }) {
  return <Image src={logo} alt={alt} priority={priority} unoptimized className={cn("h-10 w-auto lg:h-12", className)} />;
}
