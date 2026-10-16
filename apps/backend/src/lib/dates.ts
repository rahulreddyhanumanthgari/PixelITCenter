// Calendar dates ("YYYY-MM-DD") and months ("YYYY-MM").
//
// Postgres DATE columns come back from Prisma as midnight UTC, so every date here
// is handled as a UTC calendar day. "Today" is taken in the business time zone
// (JOBS_TIMEZONE, default America/New_York), so an invoice issued at 9pm ET is
// dated that day and not the next.

export const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
export const DAY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/** A calendar day as a Date at midnight UTC (what a DATE column stores). */
export const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

export const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export const isRealDay = (iso: string) => DAY.test(iso) && isoDay(day(iso)) === iso;

export function addDays(iso: string, n: number) {
  const d = day(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return isoDay(d);
}

/** Today in a time zone, as YYYY-MM-DD. */
export function todayIn(timeZone: string, now = new Date()) {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export const monthOf = (iso: string) => iso.slice(0, 7);

export const monthStart = (month: string) => `${month}-01`;

export function monthEnd(month: string) {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return isoDay(new Date(Date.UTC(y, m, 0)));
}

export function previousMonth(month: string) {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return isoDay(new Date(Date.UTC(y, m - 2, 1))).slice(0, 7);
}

/** "2026-09" → "September 2026". */
export const monthLabel = (month: string) =>
  new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(day(monthStart(month)));

/** "2026-10-14" → "Oct 14, 2026". */
export const dayLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(day(iso));

/** Days from `today` to the last day of its month (0 on the last day). */
export const daysLeftInMonth = (today: string) => Number(monthEnd(monthOf(today)).slice(8)) - Number(today.slice(8));
