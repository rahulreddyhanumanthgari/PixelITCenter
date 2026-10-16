// CSV for spreadsheet export. Cells that start with = + - @ (or a tab / CR) are
// prefixed with a quote so Excel and Sheets show them as text instead of running
// them as formulas (CSV injection).

type Cell = string | number | boolean | null | undefined;

function cell(v: Cell) {
  if (v === null || v === undefined) return "";
  let s = String(v);
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: Cell[][]) {
  return [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}
