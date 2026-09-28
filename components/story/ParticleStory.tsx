import type { ReactNode } from "react";
import { StoryCanvasLoader } from "./StoryCanvasLoader";

/**
 * Layout for the four particle-story sections. The sections scroll in one
 * column while a single persistent particle canvas stays pinned beside them
 * (desktop: right column; phones: a band under the header), so the forms
 * never sit on top of the text.
 *
 * Children must be the four story sections, each marked `data-story-section`.
 */
export function ParticleStory({ children }: { children: ReactNode }) {
  return (
    <div data-story className="relative border-t border-border">
      <div className="mx-auto max-w-7xl lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8 lg:px-8">
        <div
          aria-hidden="true"
          className="sticky top-16 z-10 h-[34svh] border-b border-border bg-background lg:order-2 lg:top-0 lg:h-screen lg:self-start lg:border-0"
        >
          <StoryCanvasLoader />
          {/* Soft edges so the canvas melts into the page on desktop. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-24 bg-gradient-to-b from-background to-transparent lg:block" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background to-transparent lg:h-24" />
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-16 bg-gradient-to-r from-background to-transparent lg:block" />
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-16 bg-gradient-to-l from-background to-transparent lg:block" />
        </div>
        <div className="px-4 sm:px-6 lg:order-1 lg:px-0">{children}</div>
      </div>
    </div>
  );
}
