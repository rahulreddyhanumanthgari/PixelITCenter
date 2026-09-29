import { cn } from "@/lib/utils";
import { HeadingText } from "@/components/ui/heading-text";

interface SectionHeaderProps {
  eyebrow: string;
  /** Supports `*important word*` and ` | ` preferred line breaks (HeadingText). */
  title: string;
  body?: string;
  id?: string;
  className?: string;
  /**
   * Scroll choreography exit on/off. Off for a pinned header: it never
   * scrolls away, so it only plays its entrance (triggered by its section).
   */
  revealExit?: boolean;
}

/** Eyebrow → section heading → optional description, on the type system. */
export function SectionHeader({ eyebrow, title, body, id, className, revealExit = true }: SectionHeaderProps) {
  const pinned = revealExit ? undefined : "";
  return (
    <div className={cn("max-w-3xl", className)}>
      <p data-reveal="0" data-reveal-static={pinned} className="type-eyebrow mb-4">
        {eyebrow}
      </p>
      <h2 data-reveal="1" data-reveal-static={pinned} id={id} className="type-display-lg">
        <HeadingText text={title} />
      </h2>
      {body && (
        <p data-reveal="2" data-reveal-static={pinned} className="type-body mt-6 [.text-center_&]:mx-auto">
          {body}
        </p>
      )}
    </div>
  );
}

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}
