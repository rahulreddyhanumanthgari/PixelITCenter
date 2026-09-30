import { Card } from "@/components/ui/card";

interface ServiceCardProps {
  /** Position in its group: the large, light orange number (01, 02…). */
  index: number;
  title: string;
  description: string;
  /** Tiny technical label, bottom right (from the service itself). */
  label: string;
}

/**
 * A service as a quiet editorial panel on the site's one card system
 * (`.card`, `.card--panel` in styles/globals.css): number, title, a partial
 * accent line, a narrow description and a small label. No icon or box —
 * the title is the identifier and whitespace does the separating. Odd and
 * even panels alternate an orange / orange-to-blue accent line.
 */
export function ServiceCard({ index, title, description, label }: ServiceCardProps) {
  return (
    <Card as="li" variant="panel" data-reveal="5" data-accent={index % 2 === 0 ? "blue" : undefined}>
      <span className="panel-index" aria-hidden="true">
        {String(index).padStart(2, "0")}
      </span>
      <h4 className="card-title panel-title">{title}</h4>
      <span className="panel-line" aria-hidden="true" />
      <p className="panel-body">{description}</p>
      <span className="panel-label">{label}</span>
    </Card>
  );
}
