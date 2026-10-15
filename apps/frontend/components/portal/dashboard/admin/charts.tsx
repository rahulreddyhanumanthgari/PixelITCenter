"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

// Small, dependency-free charts for the Admin panel's Analytics tab.
// Specs (dataviz method): columns <= 24px with 4px rounded tops, square at the
// baseline, 2px surface gap between grouped columns; 1px solid recessive grid;
// one y-axis; text in text tokens, never the series colour; a legend for 2+
// series; hover/focus tooltip on every column group; a table view for every chart.
//
// Colours: categorical slots 1 and 2 of the validated reference palette
// (blue #2a78d6, orange #eb6834): all checks pass on white (CVD ΔE 24.7).

export const SERIES = ["#2a78d6", "#eb6834"] as const;

export type Series = { name: string; values: number[] };

const GRID = "rgb(4 19 39 / 0.08)";

/** Counts get whole-number steps (0, 1, 2, 3, 4…), never 1.3 people. */
function countMax(max: number) {
  return Math.max(4, Math.ceil(max / 4) * 4);
}

/** 0, 5, 10… a clean top for the axis. */
function niceMax(max: number) {
  if (max <= 0) return 4;
  const step = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * step >= max) return m * step;
  return 10 * step;
}

const compact = (n: number) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);

/** Grouped columns over months: one or two series on one axis. */
export function ColumnChart({
  labels,
  series,
  format = (n) => String(n),
  axisFormat = compact,
  height = 220,
}: {
  labels: string[];
  series: Series[];
  format?: (n: number) => string;
  axisFormat?: (n: number) => string;
  height?: number;
}) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  // Drawn at its real width, so axis text stays 11px on a phone instead of shrinking.
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => e && setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const pad = { top: 16, right: 8, bottom: 28, left: 44 };
  const plotW = W - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const all = series.flatMap((s) => s.values);
  const top = Math.max(0, ...all);
  const max = all.every(Number.isInteger) && top < 1000 ? countMax(top) : niceMax(top);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const band = plotW / labels.length;
  const barW = Math.min(24, (band * 0.6 - 2 * (series.length - 1)) / series.length);
  const groupW = barW * series.length + 2 * (series.length - 1);
  const y = (v: number) => pad.top + plotH - (v / max) * plotH;

  /** A column with a 4px rounded top and a square foot on the baseline. */
  const column = (x: number, v: number) => {
    const top = y(v);
    const h = pad.top + plotH - top;
    if (h <= 0) return "";
    const r = Math.min(4, h, barW / 2);
    const base = pad.top + plotH;
    return `M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${base} Z`;
  };

  return (
    <div className="relative" ref={box}>
      <svg viewBox={`0 0 ${W} ${height}`} className="block h-auto w-full" role="img" aria-labelledby={`${id}-desc`}>
        <desc id={`${id}-desc`}>
          {series.map((s) => `${s.name}: ${labels.map((l, i) => `${l} ${format(s.values[i] ?? 0)}`).join(", ")}`).join(". ")}
        </desc>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
            <text x={pad.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-[var(--dash-muted)] text-[11px]">
              {axisFormat(t)}
            </text>
          </g>
        ))}
        {labels.map((label, i) => {
          const x0 = pad.left + band * i + (band - groupW) / 2;
          return (
            <g key={label}>
              {hover === i && <rect x={pad.left + band * i} y={pad.top} width={band} height={plotH} fill="rgb(4 19 39 / 0.04)" />}
              {series.map((s, k) => (
                <path key={s.name} d={column(x0 + k * (barW + 2), s.values[i] ?? 0)} fill={SERIES[k]} />
              ))}
              <text x={pad.left + band * i + band / 2} y={height - 8} textAnchor="middle" className="fill-[var(--dash-muted)] text-[11px]">
                {label}
              </text>
              {/* The hit target is the whole month band, bigger than the columns. */}
              <rect
                x={pad.left + band * i}
                y={pad.top}
                width={band}
                height={plotH}
                fill="transparent"
                tabIndex={0}
                role="button"
                aria-label={`${label}: ${series.map((s) => `${s.name} ${format(s.values[i] ?? 0)}`).join(", ")}`}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                className="cursor-default outline-none focus-visible:stroke-[var(--dash-orange)] focus-visible:stroke-2"
              />
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl bg-white px-3 py-2 text-xs shadow-[0_10px_30px_-12px_rgb(4_19_39/0.45)] ring-1 ring-[var(--dash-line)]"
          style={{ left: `${((pad.left + band * hover + band / 2) / W) * 100}%` }}
        >
          <p className="font-semibold">{labels[hover]}</p>
          {series.map((s, k) => (
            <p key={s.name} className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-[var(--dash-muted)]">
              <span className="size-2 rounded-full" style={{ background: SERIES[k] }} aria-hidden="true" />
              {s.name}: <span className="font-semibold text-[var(--dash-ink)]">{format(s.values[hover] ?? 0)}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function Legend({ names }: { names: string[] }) {
  if (names.length < 2) return null;
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--dash-muted)]" aria-label="Legend">
      {names.map((n, k) => (
        <li key={n} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES[k] }} aria-hidden="true" />
          {n}
        </li>
      ))}
    </ul>
  );
}

/** A chart in a card: title, legend, the chart, and a "Show table" switch. */
export function ChartCard({
  title,
  body,
  labels,
  series,
  format,
  axisFormat,
  className,
}: {
  title: string;
  body?: string;
  labels: string[];
  series: Series[];
  format?: (n: number) => string;
  axisFormat?: (n: number) => string;
  className?: string;
}) {
  const [table, setTable] = useState(false);
  const fmt = format ?? ((n: number) => String(n));
  return (
    <section className={cn("dash-card dash-card-pad", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-[0.9375rem] font-semibold">{title}</h3>
          {body && <p className="mt-0.5 text-xs text-[var(--dash-muted)]">{body}</p>}
        </div>
        <button type="button" className="text-xs font-semibold text-[var(--dash-orange-ink)] hover:underline" aria-pressed={table} onClick={() => setTable((t) => !t)}>
          {table ? "Show chart" : "Show table"}
        </button>
      </div>
      <div className="mt-3">
        <Legend names={series.map((s) => s.name)} />
      </div>
      <div className="mt-3">
        {table ? (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th scope="col">Month</th>
                  {series.map((s) => (
                    <th key={s.name} scope="col">
                      {s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {labels.map((l, i) => (
                  <tr key={l}>
                    <td>{l}</td>
                    {series.map((s) => (
                      <td key={s.name}>{fmt(s.values[i] ?? 0)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ColumnChart labels={labels} series={series} format={format} axisFormat={axisFormat} />
        )}
      </div>
    </section>
  );
}

/** Horizontal bars for a few categories (single hue: magnitude). Values sit at the bar ends. */
export function BarList({ items, format = (n) => String(n) }: { items: { label: string; value: number; note?: string }[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.label}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-medium">{i.label}</span>
            <span className="font-semibold tabular-nums">{format(i.value)}</span>
          </div>
          <div className="mt-1.5 h-2.5 rounded-full bg-[rgb(4_19_39/0.06)]">
            <div className="h-full rounded-full" style={{ width: `${(i.value / max) * 100}%`, background: SERIES[0] }} />
          </div>
          {i.note && <p className="mt-1 text-xs text-[var(--dash-muted)]">{i.note}</p>}
        </li>
      ))}
    </ul>
  );
}

/** A stat tile: label, value, change vs last month (arrow + words, so not colour alone). */
export function StatTile({
  label,
  value,
  delta,
  upIsGood = true,
  note,
  formatDelta = (n) => String(Math.abs(n)),
}: {
  label: string;
  value: string;
  delta?: number;
  upIsGood?: boolean;
  note?: ReactNode;
  formatDelta?: (n: number) => string;
}) {
  const dir = delta === undefined || delta === 0 ? 0 : delta > 0 ? 1 : -1;
  const good = dir === 0 ? null : (dir > 0) === upIsGood;
  const Icon = dir > 0 ? ArrowUpRight : dir < 0 ? ArrowDownRight : Minus;
  return (
    <li className="dash-stat">
      <p className="text-[0.8125rem] font-medium text-[var(--dash-muted)]">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold">{value}</p>
      {delta !== undefined ? (
        <p
          className={cn(
            "mt-0.5 flex items-center gap-1 text-xs font-medium",
            good === null ? "text-[var(--dash-muted)]" : good ? "text-[var(--dash-cyan-ink)]" : "text-[var(--dash-red-ink)]",
          )}
        >
          <Icon className="size-3.5" aria-hidden="true" />
          {dir === 0 ? "Same as last month" : `${dir > 0 ? "+" : "−"}${formatDelta(delta!)} vs last month`}
        </p>
      ) : (
        note && <p className="mt-0.5 text-xs text-[var(--dash-muted)]">{note}</p>
      )}
    </li>
  );
}
