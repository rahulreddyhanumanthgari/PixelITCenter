import type { ReactNode } from "react";
import { StoryChoreography } from "./StoryChoreography";

/**
 * Layout for the four particle-story sections, plus the pinned, empty
 * "anchor" the page-wide JourneyLayer places the particles in.
 *
 * Desktop: the anchor spans the story area (sticky, full screen height, no
 * layout space); each section takes ~half the width on the side opposite its
 * particle form, so the composition alternates and particles never sit on
 * text. Phones/tablets: the anchor is a band under the header and the text
 * scrolls beneath it.
 *
 * Children must be the four story sections, each marked `data-story-section`.
 */
export function ParticleStory({ children }: { children: ReactNode }) {
  return (
    <div data-story className="relative border-t border-border">
      <div className="mx-auto max-w-7xl lg:px-8">
        {/*
          Phones: once pinned (data-stuck, set by JourneyScene) the band turns
          opaque so text scrolling beneath it is hidden, and the particle layer
          is drawn on top of it, clipped to its box. Until then it is
          see-through. Desktop: always transparent; particles show from behind.
        */}
        <div
          data-story-anchor
          aria-hidden="true"
          className="pointer-events-none sticky top-16 z-10 h-[34svh] border-b border-transparent data-[stuck=true]:border-border data-[stuck=true]:bg-background lg:top-0 lg:-mb-[100vh] lg:h-screen lg:border-0 lg:data-[stuck=true]:bg-transparent"
        />
        <div className="relative px-4 sm:px-6 lg:px-0">{children}</div>
      </div>
      <StoryChoreography />
    </div>
  );
}
