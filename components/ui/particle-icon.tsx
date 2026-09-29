import { cn } from "@/lib/utils";

/**
 * Small icons drawn in the site's particle language: each shape is sampled
 * into dots on a 24×24 grid. Orange dots trace the main shape, blue dots the
 * secondary lines, bright cream dots the key points (nodes); a few dots
 * twinkle slowly (`.particle-icon` in globals.css). Pure SVG, computed once
 * per icon.
 */
export type ParticleIconName =
  | "ai"
  | "cloud"
  | "security"
  | "data"
  | "devops"
  | "qa"
  | "network"
  | "staffing"
  | "contract"
  | "services"
  | "project"
  | "analysis"
  | "specialist";

type Tone = "main" | "dim" | "node";
interface Dot {
  x: number;
  y: number;
  tone: Tone;
}

const STEP = 1.55; // spacing between dots along a stroke
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Collects dots from simple strokes, skipping any too close to an existing one. */
class Draw {
  dots: Dot[] = [];
  private add(x: number, y: number, tone: Tone) {
    const min = tone === "node" ? 0.1 : STEP * 0.6;
    if (tone !== "node" && this.dots.some((d) => Math.hypot(d.x - x, d.y - y) < min)) return;
    this.dots.push({ x, y, tone });
  }
  node(x: number, y: number) {
    this.add(x, y, "node");
    return this;
  }
  line(x1: number, y1: number, x2: number, y2: number, tone: Tone = "main") {
    const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / STEP));
    for (let i = 0; i <= n; i++) this.add(x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n, tone);
    return this;
  }
  path(points: [number, number][], tone: Tone = "main") {
    for (let i = 1; i < points.length; i++) this.line(...points[i - 1], ...points[i], tone);
    return this;
  }
  /** Arc in degrees; 0° = right, 90° = down (SVG orientation). */
  arc(cx: number, cy: number, r: number, from = 0, to = 360, tone: Tone = "main") {
    const n = Math.max(2, Math.round((rad(Math.abs(to - from)) * r) / STEP));
    for (let i = 0; i <= n; i++) {
      const a = rad(from + ((to - from) * i) / n);
      this.add(cx + Math.cos(a) * r, cy + Math.sin(a) * r, tone);
    }
    return this;
  }
}

const ICONS: Record<ParticleIconName, () => Draw> = {
  // A small neural network: three layers of nodes and their links.
  ai: () => {
    const d = new Draw();
    const a = [[4, 7], [4, 17]], b = [[12, 4], [12, 12], [12, 20]], c = [[20, 12]];
    for (const [x1, y1] of a) for (const [x2, y2] of b) d.line(x1, y1, x2, y2, "dim");
    for (const [x1, y1] of b) for (const [x2, y2] of c) d.line(x1, y1, x2, y2, "main");
    [...a, ...b, ...c].forEach(([x, y]) => d.node(x, y));
    return d;
  },
  cloud: () =>
    new Draw()
      .arc(7.5, 14, 3.5, 90, 265)
      .arc(12.5, 10.5, 5, 200, 340)
      .arc(17, 13.5, 4, 285, 450)
      .line(7.5, 17.5, 17, 17.5)
      .node(12, 17.5),
  security: () =>
    new Draw()
      .path([[12, 3], [19, 6], [19, 12], [16.5, 17], [12, 21], [7.5, 17], [5, 12], [5, 6], [12, 3]])
      .path([[9, 12], [11, 14.5], [15.5, 9.5]], "dim")
      .node(11, 14.5),
  // Rising bars on a baseline.
  data: () =>
    new Draw()
      .line(3, 20.5, 21, 20.5, "dim")
      .line(6, 19, 6, 14)
      .line(10, 19, 10, 10)
      .line(14, 19, 14, 12)
      .line(18, 19, 18, 5)
      .node(18, 5),
  // An infinity loop: build ↔ run.
  devops: () => {
    const d = new Draw();
    const pts: [number, number][] = [];
    for (let i = 0; i <= 96; i++) {
      const t = (i / 96) * Math.PI * 2;
      const k = 1 + Math.sin(t) ** 2;
      pts.push([12 + (9 * Math.cos(t)) / k, 12 + (9 * Math.sin(t) * Math.cos(t)) / k]);
    }
    d.path(pts).node(21, 12).node(3, 12);
    return d;
  },
  qa: () => new Draw().arc(12, 12, 8.5, 0, 360, "dim").path([[7.5, 12.5], [10.5, 15.5], [16.5, 9]]).node(10.5, 15.5),
  // Hub and spokes inside a ring of peers.
  network: () => {
    const d = new Draw();
    const outer: [number, number][] = [[5, 5], [19, 5], [19, 19], [5, 19]];
    d.path([...outer, outer[0]], "dim");
    outer.forEach(([x, y]) => d.line(12, 12, x, y));
    [[12, 12], ...outer].forEach(([x, y]) => d.node(x, y));
    return d;
  },
  staffing: () => new Draw().arc(12, 8, 3.4).arc(12, 21, 7.5, 200, 340).node(12, 8),
  contract: () => new Draw().arc(12, 12, 8.5, 0, 360, "dim").line(12, 12, 12, 6.5).line(12, 12, 16, 14.5).node(12, 12),
  services: () =>
    new Draw()
      .path([[4, 8], [20, 8], [20, 19], [4, 19], [4, 8]])
      .path([[9, 8], [9, 5], [15, 5], [15, 8]], "dim")
      .line(4, 13, 20, 13, "dim")
      .node(12, 13),
  // Timeline bars (a Gantt view).
  project: () =>
    new Draw()
      .line(3, 4, 3, 20, "dim")
      .line(5.5, 7, 13, 7)
      .line(9, 12, 18, 12)
      .line(7, 17, 20.5, 17)
      .node(13, 7)
      .node(18, 12)
      .node(20.5, 17),
  analysis: () =>
    new Draw()
      .arc(10, 10, 6)
      .line(14.5, 14.5, 20.5, 20.5)
      .line(8, 12.5, 8, 10, "dim")
      .line(10.5, 12.5, 10.5, 7.5, "dim")
      .node(20.5, 20.5),
  specialist: () => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 10; i++) {
      const r = i % 2 === 0 ? 9.5 : 4.2;
      const a = rad(-90 + i * 36);
      pts.push([12 + Math.cos(a) * r, 12.5 + Math.sin(a) * r]);
    }
    return new Draw().path(pts).node(12, 3);
  },
};

const cache = new Map<ParticleIconName, Dot[]>();
const dotsOf = (name: ParticleIconName) => {
  let dots = cache.get(name);
  if (!dots) cache.set(name, (dots = ICONS[name]().dots));
  return dots;
};

/** Stable pseudo-random 0..1 per dot, so renders never differ. */
const hash = (i: number, x: number, y: number) => {
  const s = Math.sin(i * 12.9898 + x * 78.233 + y * 37.719) * 43758.5453;
  return s - Math.floor(s);
};

export function ParticleIcon({ name, className }: { name: ParticleIconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("particle-icon", className)}>
      {dotsOf(name).map((d, i) => {
        const h = hash(i, d.x, d.y);
        return (
          <circle
            key={i}
            cx={d.x.toFixed(2)}
            cy={d.y.toFixed(2)}
            r={d.tone === "node" ? 1.25 : d.tone === "dim" ? 0.5 : 0.62 + h * 0.18}
            data-tone={d.tone}
            data-twinkle={h > 0.8 ? "" : undefined}
            style={{ opacity: d.tone === "node" ? 1 : 0.6 + h * 0.4, animationDelay: `${(h * 4).toFixed(2)}s` }}
          />
        );
      })}
    </svg>
  );
}
