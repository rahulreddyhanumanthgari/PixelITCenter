import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  body?: string;
  id?: string;
  className?: string;
  /** Scroll choreography: the heading slides in sideways instead of rising. */
  titleRevealAxis?: "x" | "y";
  /** Scroll choreography on/off. Off for a pinned header, which never scrolls away. */
  reveal?: boolean;
}

export function SectionHeader({ eyebrow, title, body, id, className, titleRevealAxis, reveal = true }: SectionHeaderProps) {
  const order = (n: string) => (reveal ? n : undefined);
  return (
    <div className={cn("max-w-2xl", className)}>
      <p data-reveal={order("0")} className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-brand-orange">{eyebrow}</p>
      <h2 data-reveal={order("1")} data-reveal-axis={titleRevealAxis} id={id} className="font-display text-4xl font-semibold uppercase leading-[1.02] tracking-tight sm:text-5xl">
        {title}
      </h2>
      {body && <p data-reveal={order("2")} className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">{body}</p>}
    </div>
  );
}

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}
