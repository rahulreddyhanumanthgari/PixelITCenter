import { z } from "zod";

// Placement Details rules.
//
// Two levels:
//   - Draft (PUT): any subset of fields, each the right type and length.
//     Half-typed values are allowed so a student can save and come back.
//   - Submit: every required field present AND well-formed (submitRules),
//     plus both references and all three documents.
//
// The frontend mirrors these rules in
// apps/frontend/components/portal/dashboard/student/placement/fields.ts;
// change both together.

export const TEXT_FIELDS = [
  "currentLocation",
  "relocationNote",
  "visaStatus",
  "contactNumber",
  "email",
  "skypeId",
  "linkedinUrl",
  "usEntryVisaType",
  "bachelorsDegree",
  "bachelorsUniversity",
  "mastersDegree",
  "mastersUniversity",
  "availability",
  "bestTimeForCalls",
  "preferredInterviewLocation",
] as const;
export const NUMBER_FIELDS = ["usExperienceYears", "relevantExperienceYears"] as const;
export const YEAR_FIELDS = ["usEntryYear", "bachelorsYear", "mastersYear"] as const;
export const SENSITIVE_FIELDS = ["passportNumber", "ssnLast4", "dateOfBirth"] as const;
export const REFERENCE_FIELDS = ["name", "role", "location", "email", "phone"] as const;
export const DOCUMENT_TYPES = ["resume", "id", "visa"] as const;

export type TextField = (typeof TEXT_FIELDS)[number];
export type NumberField = (typeof NUMBER_FIELDS)[number];
export type YearField = (typeof YEAR_FIELDS)[number];
export type SensitiveField = (typeof SENSITIVE_FIELDS)[number];
export type ReferenceField = (typeof REFERENCE_FIELDS)[number];
export type DocumentTypeName = (typeof DOCUMENT_TYPES)[number];

/** Everything except Skype ID, the master's degree and the notes. */
export const REQUIRED_FIELDS = [
  "currentLocation",
  "relocation",
  "visaStatus",
  "contactNumber",
  "email",
  "linkedinUrl",
  "usExperienceYears",
  "relevantExperienceYears",
  "passportNumber",
  "ssnLast4",
  "dateOfBirth",
  "usEntryVisaType",
  "usEntryYear",
  "bachelorsDegree",
  "bachelorsUniversity",
  "bachelorsYear",
  "availability",
  "bestTimeForCalls",
  "preferredInterviewLocation",
] as const;

const MAX_TEXT: Partial<Record<TextField, number>> = { relocationNote: 500 };

// --- draft (PUT) ----------------------------------------------------------------

/** Trimmed text; "" clears the field (stored as null). */
const text = (max: number) =>
  z
    .string()
    .max(max * 2) // generous before trimming; the real limit is checked after
    .transform((v) => v.trim())
    .pipe(z.string().max(max))
    .transform((v) => (v === "" ? null : v))
    .nullable();

const textShape = Object.fromEntries(TEXT_FIELDS.map((f) => [f, text(MAX_TEXT[f] ?? 200).optional()])) as Record<
  TextField,
  z.ZodOptional<ReturnType<typeof text>>
>;

const referenceDraft = z
  .object({
    position: z.union([z.literal(1), z.literal(2)]),
    ...Object.fromEntries(REFERENCE_FIELDS.map((f) => [f, text(200).optional()])),
  })
  .strict() as z.ZodType<{ position: 1 | 2 } & Partial<Record<ReferenceField, string | null>>>;

/** PUT /api/student/profile. Unknown keys are refused, not ignored. */
export const draftSchema = z
  .object({
    ...textShape,
    relocation: z.boolean().nullable().optional(),
    usExperienceYears: z.number().min(0).max(60).nullable().optional(),
    relevantExperienceYears: z.number().min(0).max(60).nullable().optional(),
    usEntryYear: z.number().int().min(1900).max(2100).nullable().optional(),
    bachelorsYear: z.number().int().min(1900).max(2100).nullable().optional(),
    mastersYear: z.number().int().min(1900).max(2100).nullable().optional(),
    // Sensitive: a string sets it, null clears it, leaving it out keeps it.
    passportNumber: text(20).optional(),
    ssnLast4: text(4).optional(),
    dateOfBirth: text(10).optional(),
    references: z.array(referenceDraft).max(2).optional(),
  })
  .strict();

export type DraftInput = z.infer<typeof draftSchema>;

// --- submit ---------------------------------------------------------------------

/** One profile with sensitive fields decrypted, as checked on submit. */
export type PlainProfile = Record<TextField | SensitiveField, string | null> &
  Record<NumberField | YearField, number | null> & {
    relocation: boolean | null;
    references: (Partial<Record<ReferenceField, string | null>> & { position: number })[];
  };

const year = () => new Date().getUTCFullYear();
const digits = (v: string) => v.replace(/\D/g, "");

const phone = z
  .string()
  .regex(/^\+?[\d\s().-]+$/, "Use digits, spaces, ( ) - . and an optional leading +.")
  .refine((v) => digits(v).length >= 10 && digits(v).length <= 15, "Enter a full phone number (10 to 15 digits).");

const email = z.email("Enter a valid email address.");

const linkedin = z
  .string()
  .regex(/^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/(in|pub)\/[A-Za-z0-9\-_%.]{2,100}\/?(\?.*)?$/i, "Use your profile link, e.g. https://www.linkedin.com/in/your-name");

const experience = z.number().min(0, "Can't be negative.").max(60, "Check this number.");

function ageOn(dob: Date, today: Date) {
  let age = today.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < dob.getUTCMonth() || (today.getUTCMonth() === dob.getUTCMonth() && today.getUTCDate() < dob.getUTCDate());
  return beforeBirthday ? age - 1 : age;
}

const dateOfBirth = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker (YYYY-MM-DD).")
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(v);
  }, "That date doesn't exist.")
  .refine((v) => new Date(`${v}T00:00:00Z`) < new Date(), "Date of birth must be in the past.")
  .refine((v) => ageOn(new Date(`${v}T00:00:00Z`), new Date()) >= 18, "You must be at least 18.")
  .refine((v) => ageOn(new Date(`${v}T00:00:00Z`), new Date()) <= 100, "Check the year.");

const gradYear = z
  .number()
  .int()
  .refine((y) => y >= 1960 && y <= year() + 5, "Use a year between 1960 and five years from now.");

/** Format rules for filled-in fields. Empty required fields are reported separately. */
export const submitRules: Partial<Record<keyof PlainProfile, z.ZodType>> = {
  contactNumber: phone,
  email,
  linkedinUrl: linkedin,
  usExperienceYears: experience,
  relevantExperienceYears: experience,
  passportNumber: z.string().regex(/^[A-Za-z0-9]{6,12}$/, "6 to 12 letters and numbers, no spaces."),
  ssnLast4: z.string().regex(/^\d{4}$/, "Exactly 4 digits.").refine((v) => v !== "0000", "Exactly 4 digits."),
  dateOfBirth,
  usEntryYear: z
    .number()
    .int()
    .refine((y) => y >= 1960 && y <= year(), "Use a year between 1960 and this year."),
  bachelorsYear: gradYear,
  mastersYear: gradYear,
};

const referenceRules: Partial<Record<ReferenceField, z.ZodType>> = { email, phone };

const isEmpty = (v: unknown) => v === null || v === undefined || (typeof v === "string" && v.trim() === "");

/**
 * Field errors that block submitting, keyed like "contactNumber" or
 * "references.2.email". Empty object = ready to submit (documents aside).
 */
export function submitErrors(p: PlainProfile): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const f of REQUIRED_FIELDS) if (isEmpty(p[f])) errors[f] = "Required.";

  for (const [f, rule] of Object.entries(submitRules) as [keyof PlainProfile, z.ZodType][]) {
    const v = p[f];
    if (isEmpty(v) || errors[f]) continue;
    const r = rule.safeParse(v);
    if (!r.success) errors[f] = r.error.issues[0]?.message ?? "Invalid.";
  }

  // Master's is optional, but all-or-nothing.
  const masters = ["mastersDegree", "mastersUniversity", "mastersYear"] as const;
  if (masters.some((f) => !isEmpty(p[f]))) {
    for (const f of masters) if (isEmpty(p[f])) errors[f] = "Fill in all three master's fields, or leave all three empty.";
  }
  if (p.mastersYear && p.bachelorsYear && p.mastersYear < p.bachelorsYear && !errors.mastersYear) {
    errors.mastersYear = "Can't be before your bachelor's year.";
  }

  for (const position of [1, 2]) {
    const ref = p.references.find((r) => r.position === position) ?? { position };
    for (const f of REFERENCE_FIELDS) {
      const key = `references.${position}.${f}`;
      const v = ref[f];
      if (isEmpty(v)) {
        errors[key] = "Required.";
        continue;
      }
      const rule = referenceRules[f];
      const r = rule?.safeParse(v);
      if (r && !r.success) errors[key] = r.error.issues[0]?.message ?? "Invalid.";
    }
  }

  return errors;
}

/**
 * How much is filled in: required fields, 2 × 5 reference fields and the
 * three documents. Presence only; format is checked on submit.
 */
export function completion(
  filled: (key: (typeof REQUIRED_FIELDS)[number]) => boolean,
  references: PlainProfile["references"],
  documentTypes: DocumentTypeName[],
) {
  const missing: string[] = [];
  for (const f of REQUIRED_FIELDS) if (!filled(f)) missing.push(f);
  for (const position of [1, 2]) {
    const ref = references.find((r) => r.position === position);
    for (const f of REFERENCE_FIELDS) if (!ref || isEmpty(ref[f])) missing.push(`references.${position}.${f}`);
  }
  for (const t of DOCUMENT_TYPES) if (!documentTypes.includes(t)) missing.push(`document:${t}`);
  const total = REQUIRED_FIELDS.length + 2 * REFERENCE_FIELDS.length + DOCUMENT_TYPES.length;
  return { percent: Math.round(((total - missing.length) / total) * 100), missing };
}

// --- admin ------------------------------------------------------------------------

export const statusChangeSchema = z
  .object({
    status: z.enum(["UNDER_REVIEW", "NEEDS_UPDATE", "APPROVED"]),
    comment: z.string().trim().max(2000).optional(),
  })
  .strict()
  .refine((b) => b.status !== "NEEDS_UPDATE" || (b.comment && b.comment.length > 0), {
    message: "Say what the student needs to update.",
    path: ["comment"],
  });

export const documentTypeSchema = z.enum(DOCUMENT_TYPES);
