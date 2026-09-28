import { cn } from "@/lib/utils";

/**
 * Shared layout for the four particle-story sections (inside <ParticleStory>).
 * On desktop each fills at least a screen, so its particle form has time to
 * hold, and takes ~half the width on the side opposite its particles:
 * `side` is where the *particles* sit (keep in sync with STORY_SIDES in
 * components/journey/journey-config.ts). On phones the anchor offset clears
 * the pinned particle band under the header.
 */
export function storySectionClass(side: "left" | "right"): string {
  return cn(
    "scroll-mt-[calc(34svh+5rem)] border-t border-border py-20 first:border-t-0 sm:py-24",
    "lg:flex lg:min-h-screen lg:w-[52%] lg:scroll-mt-20 lg:flex-col lg:justify-center lg:py-28",
    side === "left" && "lg:ml-auto",
  );
}
