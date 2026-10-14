import { Prisma } from "../generated/prisma/client.js";

// Money and hours are Decimal end to end (never float arithmetic). The API sends
// them as numbers rounded to 2 places, which is exact enough to display.

type Value = string | number | Prisma.Decimal;

export const dec = (v: Value) => new Prisma.Decimal(v);

/** Round half up to cents. */
export const cents = (v: Prisma.Decimal) => v.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

/** approved hours × bill rate, to the cent. */
export const lineTotal = (hours: Value, rate: Value) => cents(dec(hours).mul(rate));

export const num = (v: Prisma.Decimal | null | undefined) => (v === null || v === undefined ? null : v.toNumber());

export const sum = (values: Prisma.Decimal[]) => values.reduce((a, b) => a.add(b), dec(0));

export const usd = (v: Value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(dec(v).toNumber());
