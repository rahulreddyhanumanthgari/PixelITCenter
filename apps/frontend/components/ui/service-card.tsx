import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ParticleIcon, type ParticleIconName } from "@/components/ui/particle-icon";

interface ServiceCardProps {
  /** Position in its group, shown as a small orange reference number (01, 02…). */
  index: number;
  /** Short technical identifier shown next to the number (from the service itself). */
  tag: string;
  icon: ParticleIconName;
  title: string;
  description: string;
}

/**
 * A service as a technical panel: the site's one card system in its `panel`
 * variant (`.card--panel` in styles/globals.css) — reference number + tag
 * and a small icon on top, the title as the strongest element, a muted
 * description, and a partial orange energy line with an arrow at the foot.
 * Every service uses this same structure; only icon, number and copy change.
 */
export function ServiceCard({ index, tag, icon, title, description }: ServiceCardProps) {
  return (
    <Card as="li" variant="panel" data-reveal="5">
      <div className="panel-meta">
        <span>
          <span className="panel-index">{String(index).padStart(2, "0")}</span>
          <span aria-hidden="true"> / </span>
          {tag}
        </span>
        <ParticleIcon name={icon} className="panel-icon" />
      </div>
      <h4 className="type-heading card-title panel-title">{title}</h4>
      <p className="panel-body">{description}</p>
      <div className="panel-foot" aria-hidden="true">
        <span className="panel-line" />
        <ArrowUpRight className="panel-arrow" />
      </div>
    </Card>
  );
}
