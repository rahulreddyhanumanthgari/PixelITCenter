// Registered students (DEMO). Every student who registers on the portal gets a
// unique PixelIT ID ("PIC-1001", "PIC-1002", ...), so two students with the same
// name are never mixed up. Staff see each student's profile, the same details the
// student fills in under Profile, on their placement card.
//
// FRONT END ONLY: this list stands in for the student table. With the backend,
// the server gives out the next PIC number when a student registers and the
// profile comes from the student's own saved Profile / Placement Details.

export type RegisteredStudent = {
  /** Unique, never reused: "PIC-" + a running number. */
  pixelitId: string;
  registeredOn: string;
  fullName: string;
  email: string;
  // Account profile (Profile page, top)
  phone: string;
  location: string;
  headline: string;
  linkedin: string;
  skills: string[];
  targetRole: string;
  availableToStart: string;
  // Placement Details (Profile page, the skill matrix)
  currentLocation: string;
  relocation: string;
  visaStatus: string;
  skypeId: string | null;
  usExperienceYears: number;
  relevantExperienceYears: number;
  usEntryVisaType: string;
  usEntryYear: number;
  /** Sensitive: shown masked until the backend serves full values (every view logged). */
  passportLast3: string;
  ssnLast4Set: boolean;
  dateOfBirthSet: boolean;
  bachelors: { degree: string; university: string; year: number };
  masters: { degree: string; university: string; year: number } | null;
  bestTimeForCalls: string;
  preferredInterviewLocation: string;
  references: { name: string; role: string; location: string; email: string; phone: string }[];
};

export const registeredStudents: RegisteredStudent[] = [
  {
    pixelitId: "PIC-1001",
    registeredOn: "2026-06-18",
    fullName: "Manas",
    email: "student@pixelitcenter.com",
    phone: "+1 (919) 555-0142",
    location: "Raleigh, NC",
    headline: "Cloud engineer, open to work",
    linkedin: "https://www.linkedin.com/in/manas-cloud",
    skills: ["AWS", "Linux", "Python"],
    targetRole: "Cloud Engineer",
    availableToStart: "Immediately",
    currentLocation: "Raleigh, NC",
    relocation: "Yes, anywhere on the East Coast",
    visaStatus: "H1B",
    skypeId: null,
    usExperienceYears: 3,
    relevantExperienceYears: 5.5,
    usEntryVisaType: "F1",
    usEntryYear: 2018,
    passportLast3: "567",
    ssnLast4Set: true,
    dateOfBirthSet: true,
    bachelors: { degree: "B.Tech Computer Science", university: "JNTU Hyderabad", year: 2017 },
    masters: { degree: "MS Computer Science", university: "UNC Charlotte", year: 2019 },
    bestTimeForCalls: "Weekdays 10am–2pm ET",
    preferredInterviewLocation: "Raleigh, NC",
    references: [
      { name: "Rahul", role: "Tech Lead", location: "Charlotte, NC", email: "rahul.ref@example.com", phone: "+1 704 555 0119" },
      { name: "Hari", role: "Manager", location: "Durham, NC", email: "hari.ref@example.com", phone: "919-555-0177" },
    ],
  },
  {
    pixelitId: "PIC-1002",
    registeredOn: "2026-05-02",
    fullName: "Manas",
    email: "placed@pixelitcenter.com",
    phone: "+1 (984) 555-0168",
    location: "Cary, NC",
    headline: "Cloud Engineer at Brightline Finance",
    linkedin: "https://www.linkedin.com/in/manas-aws",
    skills: ["AWS", "Terraform", "Kubernetes", "CI/CD"],
    targetRole: "Cloud Engineer",
    availableToStart: "Placed",
    currentLocation: "Cary, NC",
    relocation: "No",
    visaStatus: "H1B",
    skypeId: "manas.aws",
    usExperienceYears: 4,
    relevantExperienceYears: 6,
    usEntryVisaType: "F1",
    usEntryYear: 2017,
    passportLast3: "804",
    ssnLast4Set: true,
    dateOfBirthSet: true,
    bachelors: { degree: "B.E. Electronics", university: "Osmania University", year: 2016 },
    masters: { degree: "MS Information Systems", university: "UNC Greensboro", year: 2018 },
    bestTimeForCalls: "Evenings after 6pm ET",
    preferredInterviewLocation: "Remote",
    references: [
      { name: "Mansingh", role: "Project Manager", location: "Raleigh, NC", email: "mansingh.ref@example.com", phone: "+1 919 555 0103" },
      { name: "Joya", role: "Team Lead", location: "Atlanta, GA", email: "joya.ref@example.com", phone: "404-555-0188" },
    ],
  },
  {
    pixelitId: "PIC-1003",
    registeredOn: "2025-12-10",
    fullName: "Rahul",
    email: "rahul@pixelitcenter.com",
    phone: "+1 (336) 555-0177",
    location: "Greensboro, NC",
    headline: "DevOps and QA automation engineer",
    linkedin: "https://www.linkedin.com/in/rahul-devops",
    skills: ["DevOps", "Kubernetes", "Playwright", "Azure"],
    targetRole: "DevOps Engineer",
    availableToStart: "Placed",
    currentLocation: "Greensboro, NC",
    relocation: "Yes, within North Carolina",
    visaStatus: "Green Card",
    skypeId: null,
    usExperienceYears: 6,
    relevantExperienceYears: 7,
    usEntryVisaType: "H1B",
    usEntryYear: 2016,
    passportLast3: "219",
    ssnLast4Set: true,
    dateOfBirthSet: true,
    bachelors: { degree: "B.Tech Information Technology", university: "VIT Vellore", year: 2014 },
    masters: null,
    bestTimeForCalls: "Weekdays after 4pm ET",
    preferredInterviewLocation: "Greensboro, NC",
    references: [
      { name: "Hari", role: "Engineering Manager", location: "Charlotte, NC", email: "hari.mgr@example.com", phone: "+1 704 555 0144" },
      { name: "Joya", role: "QA Lead", location: "Durham, NC", email: "joya.qa@example.com", phone: "919-555-0131" },
    ],
  },
  {
    pixelitId: "PIC-1004",
    registeredOn: "2026-09-29",
    fullName: "Rahul",
    email: "rahul.k@example.com",
    phone: "+1 (704) 555-0190",
    location: "Charlotte, NC",
    headline: "Data engineer, open to work",
    linkedin: "https://www.linkedin.com/in/rahul-data",
    skills: ["Python", "Spark", "BigQuery", "SQL"],
    targetRole: "Data Engineer",
    availableToStart: "In 2 weeks",
    currentLocation: "Charlotte, NC",
    relocation: "Yes, anywhere in the US",
    visaStatus: "OPT EAD",
    skypeId: null,
    usExperienceYears: 2,
    relevantExperienceYears: 3,
    usEntryVisaType: "F1",
    usEntryYear: 2021,
    passportLast3: "462",
    ssnLast4Set: true,
    dateOfBirthSet: true,
    bachelors: { degree: "B.Sc Statistics", university: "Andhra University", year: 2020 },
    masters: { degree: "MS Data Science", university: "UNC Charlotte", year: 2023 },
    bestTimeForCalls: "Anytime 9am–6pm ET",
    preferredInterviewLocation: "Charlotte, NC",
    references: [
      { name: "Mansingh", role: "Professor", location: "Charlotte, NC", email: "mansingh.prof@example.com", phone: "+1 704 555 0162" },
      { name: "Joya", role: "Internship Manager", location: "Raleigh, NC", email: "joya.intern@example.com", phone: "919-555-0109" },
    ],
  },
];

export const studentByEmail = (email: string) => registeredStudents.find((s) => s.email === email.trim().toLowerCase());

export const studentByPic = (pic: string) => registeredStudents.find((s) => s.pixelitId === pic.trim().toUpperCase());

/** "PIC-1004" → 1004. */
const picNumber = (pic: string) => Number(pic.replace(/^PIC-/, ""));

/** The number after the highest one in the directory: where new sign-ups start. */
export const firstFreePicNumber = () => Math.max(...registeredStudents.map((s) => picNumber(s.pixelitId))) + 1;

export const formatPic = (n: number) => `PIC-${n}`;
