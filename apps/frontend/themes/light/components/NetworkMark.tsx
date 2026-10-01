// The hero's one bold element: the logo's node mark grown into a picture of
// what the company does. Your team (the amber hub) is connected to
// specialists in each skill (teal nodes). Drawn once on load: links draw out
// from the hub, then each skill node arrives and is named. Still afterwards.

type Point = { x: number; y: number };
type Skill = Point & { r: number; label: string; lx: number; ly: number; anchor: "start" | "middle" | "end" };

const HUB: Point & { r: number } = { x: 214, y: 196, r: 34 };

const SKILLS: Skill[] = [
  { label: "AI", x: 96, y: 76, r: 17, lx: 122, ly: 82, anchor: "start" },
  { label: "Cloud", x: 340, y: 62, r: 21, lx: 340, ly: 108, anchor: "middle" },
  { label: "Cybersecurity", x: 404, y: 196, r: 12, lx: 426, ly: 230, anchor: "end" },
  { label: "Data", x: 330, y: 318, r: 18, lx: 357, ly: 324, anchor: "start" },
  { label: "DevOps", x: 98, y: 314, r: 15, lx: 98, ly: 354, anchor: "middle" },
  { label: "QA", x: 34, y: 196, r: 11, lx: 34, ly: 228, anchor: "middle" },
];

// Small unnamed nodes and the links between skills: the wider network.
const DOTS: Point[] = [
  { x: 176, y: 22 },
  { x: 250, y: 362 },
  { x: 18, y: 112 },
];
const SIDE_LINKS: [Point, Point][] = [
  [SKILLS[1], SKILLS[2]],
  [SKILLS[2], SKILLS[3]],
  [SKILLS[4], SKILLS[5]],
  [SKILLS[0], SKILLS[5]],
  [SKILLS[0], DOTS[0]],
  [SKILLS[3], DOTS[1]],
  [SKILLS[5], DOTS[2]],
];

const STEP = 90; // ms between links
const ARRIVE = 650; // ms after a link starts until its node arrives

const d = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;
const path = (a: Point, b: Point) => `M${a.x} ${a.y}L${b.x} ${b.y}`;

export function NetworkMark() {
  const sideStart = SKILLS.length * STEP + ARRIVE;
  return (
    <svg
      viewBox="0 0 440 380"
      role="img"
      aria-label="Your team, connected to specialists in AI, cloud, cybersecurity, data, DevOps and QA"
      className="h-auto w-full max-w-[34rem] overflow-visible"
    >
      <g fill="none" strokeLinecap="round">
        {SIDE_LINKS.map(([a, b], i) => (
          <path key={i} d={path(a, b)} pathLength={1} className="net-line stroke-line" strokeWidth={1.5} style={d(sideStart + i * 60)} />
        ))}
        {SKILLS.map((s, i) => (
          <path key={s.label} d={path(HUB, s)} pathLength={1} className="net-line stroke-ink/30" strokeWidth={2} style={d(200 + i * STEP)} />
        ))}
      </g>

      {DOTS.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={5} className="net-node fill-teal/60" style={d(sideStart + 300 + i * 60)} />
      ))}

      {SKILLS.map((s, i) => (
        <g key={s.label}>
          <circle cx={s.x} cy={s.y} r={s.r} className="net-node fill-teal" style={d(200 + i * STEP + ARRIVE)} />
          <text
            x={s.lx}
            y={s.ly}
            textAnchor={s.anchor}
            className="net-label fill-ink font-sans text-[16px] font-medium"
            style={d(200 + i * STEP + ARRIVE + 150)}
          >
            {s.label}
          </text>
        </g>
      ))}

      <circle cx={HUB.x} cy={HUB.y} r={HUB.r} className="net-node fill-amber" style={d(0)} />
      <text
        x={HUB.x}
        y={HUB.y + HUB.r + 26}
        textAnchor="middle"
        className="net-label fill-ink font-display text-[18px] font-semibold"
        style={d(250)}
      >
        Your team
      </text>
    </svg>
  );
}
