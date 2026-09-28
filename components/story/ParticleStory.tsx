import type { ReactNode } from "react";

/**
 * Layout for the four particle-story sections. The sections scroll in one
 * column; beside them is a pinned, empty "anchor" slot (desktop: right
 * column; phones: a band under the header). The page-wide JourneyLayer
 * places the particles in that slot, so the forms never sit on top of text.
 *
 * Children must be the four story sections, each marked `data-story-section`.
 */
export function ParticleStory({ children }: { children: ReactNode }) {
  return (
    <div data-story className="relative border-t border-border">
      <div className="mx-auto max-w-7xl lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8 lg:px-8">
        {/*
          Phones: once pinned (data-stuck, set by JourneyScene) the band turns
          opaque so text scrolling beneath it is hidden, and the particle layer
          is drawn on top of it, clipped to its box. Until then it is
          see-through. Desktop: always transparent; particles show from behind.
        */}
        <div
          data-story-anchor
          aria-hidden="true"
          className="sticky top-16 z-10 h-[34svh] border-b border-transparent data-[stuck=true]:border-border data-[stuck=true]:bg-background lg:order-2 lg:top-0 lg:h-screen lg:self-start lg:border-0 lg:data-[stuck=true]:bg-transparent"
        />
        <div className="px-4 sm:px-6 lg:order-1 lg:px-0">{children}</div>
      </div>
    </div>
  );
}
