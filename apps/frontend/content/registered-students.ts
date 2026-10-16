// Registered students (DEMO). Every student who registers on the portal gets a
// unique PixelIT ID ("PIC-1001", "PIC-1002", ...), so two students with the same
// name are never mixed up. Staff see each student's profile, the same details the
// student fills in under Profile, on their placement card.
//
// FRONT END ONLY: this list stands in for the student table. With the backend,
// the server gives out the next PIC number when a student registers and the
// profile comes from the student's own saved Profile / Placement Details.

export type JobType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "CONTRACT_TO_HIRE";
export type WorkMode = "Remote" | "Hybrid" | "Onsite" | "Any";

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
  /** Kinds of role they'd take. */
  openTo: JobType[];
  workMode: WorkMode;
  /** Was placed, the project ended, waiting for the next one. */
  benchSince?: string;
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
    openTo: ["FULL_TIME", "CONTRACT", "CONTRACT_TO_HIRE"],
    workMode: "Hybrid",
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
    openTo: ["CONTRACT", "CONTRACT_TO_HIRE"],
    workMode: "Remote",
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
    openTo: ["CONTRACT", "FULL_TIME"],
    workMode: "Onsite",
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
    openTo: ["FULL_TIME", "CONTRACT_TO_HIRE"],
    workMode: "Any",
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
  {
    pixelitId: "PIC-1005",
    registeredOn: "2026-03-14",
    fullName: "Joya",
    email: "joya.qa@example.com",
    phone: "+1 (919) 555-0124",
    location: "Durham, NC",
    headline: "QA automation engineer",
    linkedin: "https://www.linkedin.com/in/joya-qa",
    skills: ["Selenium", "Playwright", "Java", "CI/CD", "API Testing"],
    targetRole: "QA Automation Engineer",
    availableToStart: "Immediately",
    openTo: ["CONTRACT", "CONTRACT_TO_HIRE"],
    workMode: "Remote",
    benchSince: "2026-08-29",
    currentLocation: "Durham, NC",
    relocation: "No",
    visaStatus: "H4 EAD",
    skypeId: null,
    usExperienceYears: 5,
    relevantExperienceYears: 6,
    usEntryVisaType: "H4",
    usEntryYear: 2019,
    passportLast3: "331",
    ssnLast4Set: true,
    dateOfBirthSet: true,
    bachelors: { degree: "B.Tech Computer Science", university: "Anna University", year: 2015 },
    masters: null,
    bestTimeForCalls: "Weekdays 11am–3pm ET",
    preferredInterviewLocation: "Remote",
    references: [
      { name: "Hari", role: "QA Manager", location: "Raleigh, NC", email: "hari.qa@example.com", phone: "+1 919 555 0155" },
      { name: "Mansingh", role: "Delivery Lead", location: "Cary, NC", email: "mansingh.dl@example.com", phone: "919-555-0172" },
    ],
  },
  {
    pixelitId: "PIC-1006",
    registeredOn: "2026-07-21",
    fullName: "Hari",
    email: "hari.data@example.com",
    phone: "+1 (704) 555-0136",
    location: "Charlotte, NC",
    headline: "Data analyst moving into data engineering",
    linkedin: "https://www.linkedin.com/in/hari-data",
    skills: ["SQL", "Python", "Power BI", "Tableau", "Excel"],
    targetRole: "Data Analyst",
    availableToStart: "In 2 weeks",
    openTo: ["FULL_TIME", "PART_TIME"],
    workMode: "Hybrid",
    currentLocation: "Charlotte, NC",
    relocation: "Yes, within the Carolinas",
    visaStatus: "OPT EAD",
    skypeId: "hari.analytics",
    usExperienceYears: 1,
    relevantExperienceYears: 2,
    usEntryVisaType: "F1",
    usEntryYear: 2022,
    passportLast3: "178",
    ssnLast4Set: true,
    dateOfBirthSet: true,
    bachelors: { degree: "B.Com", university: "Osmania University", year: 2020 },
    masters: { degree: "MS Business Analytics", university: "UNC Charlotte", year: 2024 },
    bestTimeForCalls: "Weekdays after 5pm ET",
    preferredInterviewLocation: "Charlotte, NC",
    references: [
      { name: "Joya", role: "Analytics Lead", location: "Charlotte, NC", email: "joya.analytics@example.com", phone: "+1 704 555 0158" },
      { name: "Rahul", role: "Professor", location: "Charlotte, NC", email: "rahul.prof@example.com", phone: "704-555-0181" },
    ],
  },
  {
    pixelitId: "PIC-1007",
    registeredOn: "2026-02-08",
    fullName: "Mansingh",
    email: "mansingh.sec@example.com",
    phone: "+1 (919) 555-0193",
    location: "Raleigh, NC",
    headline: "Cybersecurity analyst, SOC and cloud security",
    linkedin: "https://www.linkedin.com/in/mansingh-sec",
    skills: ["Splunk", "AWS", "SIEM", "Python", "IAM"],
    targetRole: "Cybersecurity Analyst",
    availableToStart: "In a month",
    openTo: ["FULL_TIME", "CONTRACT"],
    workMode: "Onsite",
    currentLocation: "Raleigh, NC",
    relocation: "Yes, anywhere in the US",
    visaStatus: "US Citizen",
    skypeId: null,
    usExperienceYears: 8,
    relevantExperienceYears: 6,
    usEntryVisaType: "N/A",
    usEntryYear: 2010,
    passportLast3: "650",
    ssnLast4Set: true,
    dateOfBirthSet: true,
    bachelors: { degree: "BS Computer Science", university: "NC State University", year: 2012 },
    masters: { degree: "MS Cybersecurity", university: "NC State University", year: 2016 },
    bestTimeForCalls: "Mornings before 10am ET",
    preferredInterviewLocation: "Raleigh, NC",
    references: [
      { name: "Manas", role: "Security Architect", location: "Raleigh, NC", email: "manas.arch@example.com", phone: "+1 919 555 0126" },
      { name: "Hari", role: "IT Director", location: "Durham, NC", email: "hari.it@example.com", phone: "919-555-0170" },
    ],
  },
  {
    pixelitId: "PIC-1008",
    registeredOn: "2026-08-02",
    fullName: "Manas",
    email: "manas.java@example.com",
    phone: "+1 (336) 555-0149",
    location: "Greensboro, NC",
    headline: "Java full-stack developer",
    linkedin: "https://www.linkedin.com/in/manas-java",
    skills: ["Java", "Spring Boot", "React", "AWS", "Microservices"],
    targetRole: "Java Developer",
    availableToStart: "Immediately",
    openTo: ["CONTRACT", "CONTRACT_TO_HIRE", "FULL_TIME"],
    workMode: "Any",
    currentLocation: "Greensboro, NC",
    relocation: "Yes, anywhere in the US",
    visaStatus: "H1B",
    skypeId: null,
    usExperienceYears: 4,
    relevantExperienceYears: 7,
    usEntryVisaType: "H1B",
    usEntryYear: 2021,
    passportLast3: "915",
    ssnLast4Set: true,
    dateOfBirthSet: true,
    bachelors: { degree: "B.Tech Computer Science", university: "JNTU Kakinada", year: 2016 },
    masters: null,
    bestTimeForCalls: "Anytime 9am–7pm ET",
    preferredInterviewLocation: "Remote",
    references: [
      { name: "Rahul", role: "Engineering Manager", location: "Greensboro, NC", email: "rahul.em@example.com", phone: "+1 336 555 0102" },
      { name: "Joya", role: "Architect", location: "Charlotte, NC", email: "joya.arch@example.com", phone: "704-555-0139" },
    ],
  },
  {
    pixelitId: "PIC-1009",
    registeredOn: "2026-09-12",
    fullName: "Joya",
    email: "joya.cloud@example.com",
    phone: "+1 (984) 555-0117",
    location: "Morrisville, NC",
    headline: "Azure cloud engineer",
    linkedin: "https://www.linkedin.com/in/joya-azure",
    skills: ["Azure", "Terraform", "Kubernetes", "PowerShell", "DevOps"],
    targetRole: "Cloud Engineer",
    availableToStart: "Immediately",
    openTo: ["CONTRACT", "CONTRACT_TO_HIRE"],
    workMode: "Hybrid",
    currentLocation: "Morrisville, NC",
    relocation: "No",
    visaStatus: "Green Card",
    skypeId: null,
    usExperienceYears: 3,
    relevantExperienceYears: 4,
    usEntryVisaType: "F1",
    usEntryYear: 2018,
    passportLast3: "703",
    ssnLast4Set: true,
    dateOfBirthSet: true,
    bachelors: { degree: "B.E. Information Science", university: "VTU Belgaum", year: 2017 },
    masters: { degree: "MS Computer Science", university: "NC State University", year: 2020 },
    bestTimeForCalls: "Weekdays 1pm–5pm ET",
    preferredInterviewLocation: "Raleigh, NC",
    references: [
      { name: "Mansingh", role: "Cloud Lead", location: "Raleigh, NC", email: "mansingh.cloud@example.com", phone: "+1 919 555 0148" },
      { name: "Hari", role: "Manager", location: "Cary, NC", email: "hari.mgr2@example.com", phone: "919-555-0163" },
    ],
  },
  {
    pixelitId: "PIC-1010",
    registeredOn: "2026-04-25",
    fullName: "Hari",
    email: "hari.devops@example.com",
    phone: "+1 (919) 555-0151",
    location: "Apex, NC",
    headline: "DevOps engineer, AWS and GCP",
    linkedin: "https://www.linkedin.com/in/hari-devops",
    skills: ["AWS", "GCP", "Docker", "Kubernetes", "Jenkins", "Terraform"],
    targetRole: "DevOps Engineer",
    availableToStart: "Immediately",
    openTo: ["CONTRACT", "FULL_TIME"],
    workMode: "Remote",
    benchSince: "2026-09-30",
    currentLocation: "Apex, NC",
    relocation: "Yes, East Coast",
    visaStatus: "H1B",
    skypeId: "hari.devops",
    usExperienceYears: 5,
    relevantExperienceYears: 6,
    usEntryVisaType: "F1",
    usEntryYear: 2017,
    passportLast3: "246",
    ssnLast4Set: true,
    dateOfBirthSet: true,
    bachelors: { degree: "B.Tech Electrical", university: "NIT Warangal", year: 2015 },
    masters: { degree: "MS Computer Engineering", university: "UNC Charlotte", year: 2018 },
    bestTimeForCalls: "Weekdays after 3pm ET",
    preferredInterviewLocation: "Remote",
    references: [
      { name: "Joya", role: "SRE Lead", location: "Raleigh, NC", email: "joya.sre@example.com", phone: "+1 919 555 0177" },
      { name: "Manas", role: "Platform Manager", location: "Durham, NC", email: "manas.pm@example.com", phone: "919-555-0112" },
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
