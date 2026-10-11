import { Clock, Users } from "lucide-react";
import { events } from "@/content/portal-demo";
import { Chip, PageHeader } from "./ui";

const KIND_TONE = { Deadline: "bad", Interview: "warn", Call: undefined, Meeting: "ink", Training: "good" } as const;

/** The next few days: meetings, interviews, training and deadlines. */
export function SchedulePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Schedule" body="What's coming up over the next few days." />
      <div className="space-y-6">
        {events.map((d) => (
          <section key={d.day} aria-labelledby={`day-${d.day}`}>
            <h2 id={`day-${d.day}`} className="dash-section-title">
              {d.day} <span className="text-sm font-normal text-[var(--dash-muted)]">{d.date}</span>
            </h2>
            <ul className="mt-3 space-y-2.5">
              {d.items.map((e) => (
                <li key={e.title} className="dash-card flex items-center gap-4 p-4">
                  <span className="w-14 flex-none text-center">
                    <span className="block text-lg leading-none font-semibold">{e.time}</span>
                  </span>
                  <span className="h-10 w-px flex-none bg-[var(--dash-line-strong)]" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{e.title}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--dash-muted)]">
                      {e.kind === "Deadline" ? <Clock className="size-3.5" aria-hidden="true" /> : <Users className="size-3.5" aria-hidden="true" />}
                      <span className="truncate">{e.with}</span>
                    </span>
                  </span>
                  <Chip tone={KIND_TONE[e.kind as keyof typeof KIND_TONE]}>{e.kind}</Chip>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
