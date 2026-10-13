// Placement Details: the form's sections, fields and rules.
//
// The rules mirror the API's (apps/backend/src/validation/profile.ts); the
// API is the one that decides. Change both together.

export type Kind = "text" | "email" | "tel" | "url" | "number" | "year" | "select" | "yesno" | "textarea" | "date";

export type FieldDef = {
  key: string;
  label: string;
  kind: Kind;
  required: boolean;
  options?: string[];
  placeholder?: string;
  hint?: string;
  max?: number; // max characters
  wide?: boolean; // spans both columns
  sensitive?: boolean; // masked, encrypted, never shown again once saved
  autoComplete?: string;
};

export type SectionId = "personal" | "education" | "interview" | "references" | "attachments";

export const VISA_STATUSES = ["US Citizen", "Green Card", "GC EAD", "H1B", "H4 EAD", "L2 EAD", "OPT EAD", "STEM OPT EAD", "CPT", "TN", "Other"];
export const ENTRY_VISAS = ["F1", "H1B", "H4", "L1", "L2", "J1", "B1/B2", "Green Card", "Other"];
export const AVAILABILITY = ["Immediately", "In 1 week", "In 2 weeks", "In 3–4 weeks", "More than a month"];

const f = (key: string, label: string, kind: Kind, more: Partial<FieldDef> = {}): FieldDef => ({ key, label, kind, required: true, max: 200, ...more });

export const PERSONAL: FieldDef[] = [
  f("currentLocation", "Current location", "text", { placeholder: "City, State", autoComplete: "address-level2" }),
  f("visaStatus", "Visa status", "select", { options: VISA_STATUSES }),
  f("relocation", "Open to relocation?", "yesno"),
  f("relocationNote", "Relocation note", "text", { required: false, max: 500, placeholder: "e.g. East Coast only, or not before March" }),
  f("contactNumber", "Contact number", "tel", { placeholder: "+1 (919) 555-0142", autoComplete: "tel" }),
  f("email", "Email ID", "email", { autoComplete: "email" }),
  f("skypeId", "Skype ID", "text", { required: false }),
  f("linkedinUrl", "LinkedIn profile", "url", { placeholder: "https://www.linkedin.com/in/your-name" }),
  f("usExperienceYears", "Total US experience (years)", "number", { placeholder: "e.g. 3" }),
  f("relevantExperienceYears", "Total relevant experience (years)", "number", { placeholder: "e.g. 5.5" }),
  f("passportNumber", "Passport number", "text", { sensitive: true, max: 20, autoComplete: "off" }),
  f("ssnLast4", "Last four digits of SSN", "text", { sensitive: true, max: 4, autoComplete: "off" }),
  f("dateOfBirth", "Date of birth", "date", { sensitive: true, max: 10, autoComplete: "off", hint: "MM/DD/YYYY" }),
  f("usEntryVisaType", "Entered USA on (visa type)", "select", { options: ENTRY_VISAS }),
  f("usEntryYear", "Entered USA in (year)", "year", { placeholder: "e.g. 2018" }),
];

export const EDUCATION: FieldDef[] = [
  f("bachelorsDegree", "Bachelor's degree", "text", { placeholder: "e.g. B.Tech, Computer Science" }),
  f("bachelorsUniversity", "University", "text"),
  f("bachelorsYear", "Year of graduation", "year", { placeholder: "e.g. 2017" }),
  f("mastersDegree", "Master's degree", "text", { required: false, placeholder: "e.g. MS, Information Systems" }),
  f("mastersUniversity", "University", "text", { required: false }),
  f("mastersYear", "Year of graduation", "year", { required: false, placeholder: "e.g. 2020" }),
];

export const INTERVIEW: FieldDef[] = [
  f("availability", "Availability", "select", { options: AVAILABILITY }),
  f("bestTimeForCalls", "Best time for interview calls", "text", { placeholder: "e.g. Weekdays, 10am–2pm ET" }),
  f("preferredInterviewLocation", "Preferred location for face-to-face interviews", "text", { placeholder: "City, State", wide: true }),
];

export const REFERENCE: FieldDef[] = [
  f("name", "Name", "text", { autoComplete: "off" }),
  f("role", "Role", "text", { placeholder: "e.g. Project manager" }),
  f("location", "Location", "text", { placeholder: "City, State" }),
  f("email", "Mail ID", "email", { autoComplete: "off" }),
  f("phone", "Contact number", "tel", { autoComplete: "off" }),
];

export const DOCUMENTS = [
  { type: "resume", label: "Updated resume", hint: "Your latest resume." },
  { type: "id", label: "Driver's License or State ID", hint: "No DL or State ID? Upload a recent utility bill with your name and address." },
  { type: "visa", label: "Visa copy", hint: "The current visa or EAD card." },
] as const;

export type DocumentType = (typeof DOCUMENTS)[number]["type"];

export const SENSITIVE_KEYS = ["passportNumber", "ssnLast4", "dateOfBirth"] as const;
export type SensitiveKey = (typeof SENSITIVE_KEYS)[number];

export const SECTIONS: { id: SectionId; title: string; body: string }[] = [
  { id: "personal", title: "Personal & professional", body: "Where you are, your visa and how recruiters reach you." },
  { id: "education", title: "Education", body: "Your bachelor's, and your master's if you have one." },
  { id: "interview", title: "Interview logistics", body: "When and where interviews work for you." },
  { id: "references", title: "References", body: "Two people from previous projects who can speak to your work." },
  { id: "attachments", title: "Attachments", body: "Your resume, ID and visa copy. PDF, JPG or PNG, up to 5 MB each." },
];

// --- form state ---------------------------------------------------------------------

/** Everything as strings, the way inputs hold them. relocation: "yes" | "no" | "". */
export type Values = Record<string, string>;
export type ReferenceValues = Record<string, string>;

const isBlank = (v: string | undefined) => !v || !v.trim();
const digits = (v: string) => v.replace(/\D/g, "");

// --- rules ---------------------------------------------------------------------------

const thisYear = () => new Date().getFullYear();

function ageOn(dob: Date, today: Date) {
  const age = today.getUTCFullYear() - dob.getUTCFullYear();
  const before = today.getUTCMonth() < dob.getUTCMonth() || (today.getUTCMonth() === dob.getUTCMonth() && today.getUTCDate() < dob.getUTCDate());
  return before ? age - 1 : age;
}

/** "4/12/1995" or "1995-04-12" → "1995-04-12"; anything else unchanged. */
export function normaliseDate(v: string) {
  const s = v.trim();
  const us = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (us) return `${us[3]}-${us[1]!.padStart(2, "0")}-${us[2]!.padStart(2, "0")}`;
  return s;
}

/** "linkedin.com/in/x" → "https://linkedin.com/in/x". */
export function normaliseUrl(v: string) {
  const s = v.trim();
  return s && !/^https?:\/\//i.test(s) ? `https://${s}` : s.replace(/^http:\/\//i, "https://");
}

const RULES: Record<string, (v: string) => string | null> = {
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? null : "Enter a valid email address."),
  tel: (v) => {
    if (!/^\+?[\d\s().-]+$/.test(v)) return "Use digits, spaces, ( ) - . and an optional leading +.";
    const n = digits(v).length;
    return n >= 10 && n <= 15 ? null : "Enter a full phone number (10 to 15 digits).";
  },
  linkedinUrl: (v) =>
    /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/(in|pub)\/[A-Za-z0-9\-_%.]{2,100}\/?(\?.*)?$/i.test(v) ? null : "Use your profile link, e.g. https://www.linkedin.com/in/your-name",
  experience: (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "Enter a number, e.g. 3 or 4.5.";
    if (n < 0) return "Can't be negative.";
    return n > 60 ? "Check this number." : null;
  },
  passportNumber: (v) => (/^[A-Za-z0-9]{6,12}$/.test(v) ? null : "6 to 12 letters and numbers, no spaces."),
  ssnLast4: (v) => (/^\d{4}$/.test(v) && v !== "0000" ? null : "Exactly 4 digits."),
  dateOfBirth: (raw) => {
    const v = normaliseDate(raw);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return "Use MM/DD/YYYY.";
    const d = new Date(`${v}T00:00:00Z`);
    if (Number.isNaN(d.getTime()) || !d.toISOString().startsWith(v)) return "That date doesn't exist.";
    if (d >= new Date()) return "Date of birth must be in the past.";
    const age = ageOn(d, new Date());
    if (age < 18) return "You must be at least 18.";
    return age > 100 ? "Check the year." : null;
  },
  usEntryYear: (v) => (/^\d{4}$/.test(v) && +v >= 1960 && +v <= thisYear() ? null : "Use a year between 1960 and this year."),
  gradYear: (v) => (/^\d{4}$/.test(v) && +v >= 1960 && +v <= thisYear() + 5 ? null : "Use a year between 1960 and five years from now."),
};

function ruleFor(def: FieldDef) {
  if (def.key === "linkedinUrl") return RULES.linkedinUrl;
  if (def.key === "usEntryYear") return RULES.usEntryYear;
  if (def.kind === "year") return RULES.gradYear;
  if (def.kind === "number") return RULES.experience;
  if (def.sensitive) return RULES[def.key];
  if (def.kind === "email") return RULES.email;
  if (def.kind === "tel") return RULES.tel;
  return undefined;
}

export type FormState = {
  values: Values;
  references: [ReferenceValues, ReferenceValues];
  /** Sensitive values already saved on the server (they never come back). */
  savedSensitive: Record<SensitiveKey, boolean>;
  documents: DocumentType[];
};

const present = (s: FormState, key: string) =>
  SENSITIVE_KEYS.includes(key as SensitiveKey) ? !isBlank(s.values[key]) || s.savedSensitive[key as SensitiveKey] : !isBlank(s.values[key]);

/**
 * Field errors, keyed like the API ("contactNumber", "references.2.email",
 * "document:visa"). `required` adds "Required." for empty required fields.
 */
export function formErrors(s: FormState, { required }: { required: boolean }) {
  const errors: Record<string, string> = {};
  for (const def of [...PERSONAL, ...EDUCATION, ...INTERVIEW]) {
    const v = s.values[def.key] ?? "";
    if (isBlank(v)) {
      if (required && def.required && !present(s, def.key)) errors[def.key] = "Required.";
      continue;
    }
    const msg = ruleFor(def)?.(v.trim());
    if (msg) errors[def.key] = msg;
  }

  const masters = ["mastersDegree", "mastersUniversity", "mastersYear"];
  if (required && masters.some((k) => !isBlank(s.values[k]))) {
    for (const k of masters) if (isBlank(s.values[k])) errors[k] = "Fill in all three master's fields, or leave all three empty.";
  }
  const by = Number(s.values.bachelorsYear);
  const my = Number(s.values.mastersYear);
  if (by && my && my < by && !errors.mastersYear) errors.mastersYear = "Can't be before your bachelor's year.";

  s.references.forEach((ref, i) => {
    for (const def of REFERENCE) {
      const key = `references.${i + 1}.${def.key}`;
      const v = ref[def.key] ?? "";
      if (isBlank(v)) {
        if (required) errors[key] = "Required.";
        continue;
      }
      const msg = ruleFor(def)?.(v.trim());
      if (msg) errors[key] = msg;
    }
  });

  if (required) for (const d of DOCUMENTS) if (!s.documents.includes(d.type)) errors[`document:${d.type}`] = "Required.";
  return errors;
}

/** Share of required items filled in (fields, 2 × 5 reference fields, 3 documents). */
export function completionOf(s: FormState) {
  const required = [...PERSONAL, ...EDUCATION, ...INTERVIEW].filter((d) => d.required);
  let done = required.filter((d) => present(s, d.key)).length;
  for (const ref of s.references) done += REFERENCE.filter((d) => !isBlank(ref[d.key])).length;
  done += DOCUMENTS.filter((d) => s.documents.includes(d.type)).length;
  const total = required.length + 2 * REFERENCE.length + DOCUMENTS.length;
  return Math.round((done / total) * 100);
}

/** How many required items in a section are filled, for the step tabs. */
export function sectionProgress(s: FormState, id: SectionId): [number, number] {
  const count = (defs: FieldDef[], has: (d: FieldDef) => boolean) => {
    const req = defs.filter((d) => d.required);
    return [req.filter(has).length, req.length] as [number, number];
  };
  if (id === "personal") return count(PERSONAL, (d) => present(s, d.key));
  if (id === "education") return count(EDUCATION, (d) => present(s, d.key));
  if (id === "interview") return count(INTERVIEW, (d) => present(s, d.key));
  if (id === "references") {
    const done = s.references.reduce((n, r) => n + REFERENCE.filter((d) => !isBlank(r[d.key])).length, 0);
    return [done, 2 * REFERENCE.length];
  }
  return [DOCUMENTS.filter((d) => s.documents.includes(d.type)).length, DOCUMENTS.length];
}

/** Which section an error key belongs to. */
export function sectionOf(key: string): SectionId {
  if (key.startsWith("references.")) return "references";
  if (key.startsWith("document:")) return "attachments";
  if (EDUCATION.some((d) => d.key === key)) return "education";
  if (INTERVIEW.some((d) => d.key === key)) return "interview";
  return "personal";
}
