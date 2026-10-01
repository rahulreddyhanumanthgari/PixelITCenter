"use client";

import { useEffect, useRef } from "react";
import {
  Award,
  BrainCircuit,
  Briefcase,
  ChartNoAxesCombined,
  ChartPie,
  Cloud,
  FilePen,
  FlaskConical,
  Infinity as InfinityIcon,
  Network,
  ShieldCheck,
  SquareKanban,
  Users,
  type LucideIcon,
} from "lucide-react";
import { services } from "@/content/site";

/**
 * Light design, Services (owner's reference): a wide, soft beige ring whose
 * centre sits on the column's right edge, so only its left half shows: it
 * enters at the top right, curves round to the left and leaves at the bottom
 * right. Every service travels round it as a flat steel-blue disc with its
 * icon, trailing a tapered flowing tail: they come in at the top and go out at
 * the bottom, round and round. Three figures sit inside the ring.
 * Hovering the ring pauses it; reduced motion shows the orbs still.
 */

const ICONS: Record<string, LucideIcon> = {
  AI: BrainCircuit,
  "Cloud (AWS, Azure, GCP)": Cloud,
  Cybersecurity: ShieldCheck,
  "Big Data Analytics": ChartNoAxesCombined,
  DevOps: InfinityIcon,
  "QA Automation": FlaskConical,
  "Networking Solutions": Network,
  "IT Staffing": Users,
  "Contract Staffing": FilePen,
  "Professional Services": Briefcase,
  "Project Management": SquareKanban,
  "Business Analysis": ChartPie,
  "Specialized Technology Talent": Award,
};

const ITEMS = services.groups.flatMap((g) => g.items.map((i) => i.title));
const PERIOD = 70; // seconds for one full turn
const ORB = 60; // px
const TAIL = 92; // px: longest flowing tail; shorter when the discs are closer (phones)

const STATS = [
  { value: String(services.groups[0].items.length), label: "Technology services" },
  { value: String(services.groups[1].items.length), label: "Talent & delivery services" },
  { value: "3", label: "Cloud platforms" },
];

export function ServicesOrbit() {
  const stage = useRef<HTMLDivElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  const ringSoft = useRef<SVGCircleElement>(null);
  const stats = useRef<HTMLDListElement>(null);
  const orbs = useRef<(HTMLDivElement | null)[]>([]);
  const trails = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, R = 0, band = 0, tail = TAIL;
    let visible = true;
    let paused = false;
    let raf = 0;
    let phase = 0; // radians turned so far
    let last = performance.now();

    const measure = () => {
      w = el.clientWidth;
      h = el.clientHeight;
      // Leave room above and below for the band's soft edge (band = 0.3R, plus blur).
      R = Math.max(80, Math.min(w * 0.88, (h / 2 - 24) / 1.15));
      band = R * 0.3;
      for (const c of [ring.current, ringSoft.current]) {
        c?.setAttribute("cx", String(w));
        c?.setAttribute("cy", String(h / 2));
        c?.setAttribute("r", String(R));
      }
      ring.current?.setAttribute("stroke-width", String(band * 0.62));
      ringSoft.current?.setAttribute("stroke-width", String(band));
      // The figures sit in the ring's open centre, clear of the orbs.
      if (stats.current) stats.current.style.left = `${w - R + band / 2 + ORB / 2 + 16}px`;
      // Each tail ends well before the disc behind it.
      tail = Math.min(TAIL, ((2 * Math.PI * R) / ITEMS.length) * 0.55);
      for (const t of trails.current) if (t) t.style.width = `${tail}px`;
    };

    const place = () => {
      const n = ITEMS.length;
      ITEMS.forEach((_, i) => {
        // Top → left → bottom: the angle decreases from 270° through 180° to 90°.
        const a = (3 * Math.PI) / 2 - phase + (i * 2 * Math.PI) / n;
        const x = w + R * Math.cos(a);
        const y = h / 2 + R * Math.sin(a);
        const orb = orbs.current[i];
        if (orb) orb.style.transform = `translate(${x - ORB / 2}px, ${y - ORB / 2}px)`;
        // The blur trails behind the orb, along the ring.
        const vx = Math.sin(a);
        const vy = -Math.cos(a);
        const trail = trails.current[i];
        if (trail) {
          // The tail runs from the disc back along the ring.
          const tx = x - vx * (tail / 2);
          const ty = y - vy * (tail / 2);
          trail.style.transform = `translate(${tx - tail / 2}px, ${ty - ORB * 0.36}px) rotate(${Math.atan2(vy, vx)}rad)`;
        }
      });
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!paused) phase += (dt * 2 * Math.PI) / PERIOD;
      place();
      raf = visible ? requestAnimationFrame(tick) : 0;
    };

    measure();
    place();
    const ro = new ResizeObserver(() => {
      measure();
      place();
    });
    ro.observe(el);

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !reduced && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    });
    io.observe(el);

    const pause = () => (paused = true);
    const resume = () => (paused = false);
    el.addEventListener("pointerenter", pause);
    el.addEventListener("pointerleave", resume);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      el.removeEventListener("pointerenter", pause);
      el.removeEventListener("pointerleave", resume);
    };
  }, []);

  return (
    <div ref={stage} className="svc-orbit">
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <filter id="svc-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>
        {/* The band: a wide soft halo and a firmer core, warm grey-beige. */}
        <circle ref={ringSoft} fill="none" stroke="#e2ddd8" filter="url(#svc-soft)" />
        <circle ref={ring} fill="none" stroke="#d4cec9" filter="url(#svc-soft)" opacity="0.9" />
      </svg>

      <div aria-hidden="true">
        {ITEMS.map((title, i) => {
          const Icon = ICONS[title] ?? Award;
          return (
            <div key={title}>
              <div
                ref={(d) => {
                  trails.current[i] = d;
                }}
                className="svc-trail"
              />
              <div
                ref={(d) => {
                  orbs.current[i] = d;
                }}
                className="svc-orb"
                title={title}
              >
                <Icon className="svc-orb-icon" strokeWidth={2.25} />
              </div>
            </div>
          );
        })}
      </div>

      <dl ref={stats} className="svc-stats">
        {STATS.map((s) => (
          <div key={s.label} className="flex flex-col-reverse">
            <dt className="svc-stat-label">{s.label}</dt>
            <dd className="svc-stat-value">{s.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
