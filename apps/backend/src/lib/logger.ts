// Minimal logger. Rules for anything that calls it:
//   - never pass request bodies, query strings or profile fields;
//   - errors are logged by name / code only when they could carry user data
//     (Prisma validation errors print the arguments they were given).

type Meta = Record<string, string | number | boolean | undefined>;

function line(level: "info" | "warn" | "error", msg: string, meta?: Meta) {
  const out = JSON.stringify({ t: new Date().toISOString(), level, msg, ...meta });
  if (level === "error") console.error(out);
  else console.log(out);
}

export const log = {
  info: (msg: string, meta?: Meta) => line("info", msg, meta),
  warn: (msg: string, meta?: Meta) => line("warn", msg, meta),
  error: (msg: string, meta?: Meta) => line("error", msg, meta),
};
