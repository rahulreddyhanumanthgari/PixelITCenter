import { cn } from "@/lib/utils";

type Tone = "paper" | "mist" | "ink";

const TONES: Record<Tone, string> = {
  paper: "bg-paper text-ink",
  mist: "bg-mist text-ink",
  ink: "bg-ink text-paper",
};

/** Page-width container shared by every section. */
export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[75rem] px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

interface SectionProps {
  id?: string;
  title: string;
  /** Short line under the heading, in the left column on desktop. */
  intro?: string;
  tone?: Tone;
  children: React.ReactNode;
}

/**
 * The light design's section layout: on desktop the heading holds the left
 * third (and stays in view while the content scrolls), the content takes the
 * right two-thirds. On phones they stack.
 */
export function Section({ id, title, intro, tone = "paper", children }: SectionProps) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className={cn("py-20 lg:py-28", TONES[tone])}>
      <Container className="lg:grid lg:grid-cols-12 lg:gap-x-12">
        <header className="lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
          <h2 id={headingId} className="l-h2">
            {title}
          </h2>
          {intro && <p className={cn("l-body mt-4", tone === "ink" && "text-paper/70")}>{intro}</p>}
        </header>
        <div className="mt-10 lg:col-span-8 lg:mt-0">{children}</div>
      </Container>
    </section>
  );
}
