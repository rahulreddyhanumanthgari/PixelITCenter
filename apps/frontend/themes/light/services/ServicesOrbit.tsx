"use client";

import { useEffect, useRef } from "react";
import {
  BrainCircuit,
  BriefcaseBusiness,
  BugOff,
  ChartGantt,
  CloudCog,
  DatabaseZap,
  FileSignature,
  Infinity as InfinityIcon,
  Network,
  Presentation,
  ShieldCheck,
  UserRoundSearch,
  UserStar,
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

// One clear, literal icon per service.
const ICONS: Record<string, LucideIcon> = {
  AI: BrainCircuit,
  "Cloud (AWS, Azure, GCP)": CloudCog,
  Cybersecurity: ShieldCheck,
  "Big Data Analytics": DatabaseZap,
  DevOps: InfinityIcon, // the DevOps loop
  "QA Automation": BugOff,
  "Networking Solutions": Network,
  "IT Staffing": UserRoundSearch,
  "Contract Staffing": FileSignature,
  "Professional Services": BriefcaseBusiness,
  "Project Management": ChartGantt,
  "Business Analysis": Presentation,
  "Specialized Technology Talent": UserStar,
};

const ITEMS = services.groups.flatMap((g) => g.items.map((i) => i.title));
const ORB = 92; // px
const VISIBLE = 3; // discs on screen at a time
const SPEED = 32; // px per second along the ring
const TAIL = 100; // px: longest flowing tail (never more than about half the gap)

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
    let w = 0, h = 0, R = 0, band = 0, tail = TAIL, gap = ORB * 3, reach = 0;
    let visible = true;
    let paused = false;
    let raf = 0;
    let travelled = 0; // px moved along the ring so far
    let last = performance.now();

    const measure = () => {
      w = el.clientWidth;
      h = el.clientHeight;
      // A wide sweep: the ring reaches far to the left and runs past the top
      // and bottom of its area, so the discs enter and leave along those edges.
      // Never so far left that a disc is cut off at the column edge.
      R = Math.max(80, Math.min(w * 0.95, w - ORB / 2 - 10, h * 0.72));
      band = R * 0.34;
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
      // Spacing: the arc visible inside the area holds exactly VISIBLE discs.
      const visibleArc = 2 * R * Math.asin(Math.min(1, h / 2 / R));
      // How far along the ring (from its left point) a disc can still be seen.
      reach = visibleArc / 2 + ORB;
      gap = Math.max(ORB * 1.4, visibleArc / VISIBLE);
      tail = Math.min(TAIL, gap * 0.4);
      for (const t of trails.current) if (t) t.style.width = `${tail}px`;
    };

    // The discs ride one loop of evenly spaced slots centred on the ring's
    // leftmost point: they flow down from above the area, sweep past the
    // left and leave below it, then wrap round unseen to come in at the top
    // again. So the visible arc is always evenly filled, however wide.
    const place = () => {
      const n = ITEMS.length;
      const loop = n * gap;
      ITEMS.forEach((_, i) => {
        const s = (((i * gap + travelled) % loop) + loop) % loop; // 0 = top end of the loop
        const d = loop / 2 - s; // arc distance from the ring's left point (+ above, − below)
        const a = Math.PI + d / R; // above the left point → below it
        // Off the visible arc the disc waits unseen (it may overlap others there).
        const shown = Math.abs(d) <= reach;
        const x = w + R * Math.cos(a);
        const y = h / 2 + R * Math.sin(a);
        const orb = orbs.current[i];
        if (orb) {
          orb.style.visibility = shown ? "" : "hidden";
          orb.style.transform = `translate(${x - ORB / 2}px, ${y - ORB / 2}px)`;
        }
        // The blur trails behind the orb, along the ring.
        const vx = Math.sin(a);
        const vy = -Math.cos(a);
        const trail = trails.current[i];
        if (trail) trail.style.visibility = shown ? "" : "hidden";
        if (trail && shown) {
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
      if (!paused) travelled += dt * SPEED;
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
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        {/* The band: light beige, a shade darker than the page, a slightly soft edge (never a dark shadow). */}
        <circle ref={ringSoft} fill="none" stroke="#ede8e3" filter="url(#svc-soft)" />
        <circle ref={ring} fill="none" stroke="#e7e1db" filter="url(#svc-soft)" />
      </svg>

      <div aria-hidden="true">
        {ITEMS.map((title, i) => {
          const Icon = ICONS[title] ?? BrainCircuit;
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
