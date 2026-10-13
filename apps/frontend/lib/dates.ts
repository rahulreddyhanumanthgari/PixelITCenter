// Date helpers for YYYY-MM-DD strings. Dates are built in local time from
// their parts, so "2026-10-12" is always Oct 12 whatever the time zone.

export function parseDay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toIso(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

export function addDays(iso: string, days: number) {
  const d = parseDay(iso);
  d.setDate(d.getDate() + days);
  return toIso(d);
}

/** "Mon, Oct 12" */
export function shortDate(iso: string) {
  return parseDay(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** "Monday, October 12" */
export function longDate(iso: string) {
  return parseDay(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

/** "Today", "Tomorrow", "Yesterday", or the weekday ("Wednesday"). */
export function dayName(iso: string, today: string) {
  if (iso === today) return "Today";
  if (iso === addDays(today, 1)) return "Tomorrow";
  if (iso === addDays(today, -1)) return "Yesterday";
  return parseDay(iso).toLocaleDateString("en-US", { weekday: "long" });
}

/** The 6×7 grid of days (Sunday first) that shows a month. */
export function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { iso: toIso(d), day: d.getDate(), inMonth: d.getMonth() === month };
  });
}
