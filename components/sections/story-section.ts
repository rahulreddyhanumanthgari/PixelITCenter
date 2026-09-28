/**
 * Shared layout for the four particle-story sections (they sit in the text
 * column of <ParticleStory>). On desktop each fills at least a screen so its
 * particle form has time to hold before the next one assembles. On phones the
 * anchor offset clears the pinned particle band under the header.
 */
export const STORY_SECTION_CLASS =
  "scroll-mt-[calc(34svh+5rem)] border-t border-border py-20 first:border-t-0 sm:py-24 lg:flex lg:min-h-screen lg:scroll-mt-20 lg:flex-col lg:justify-center lg:py-28";
