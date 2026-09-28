// All homepage copy in one place. Everything here is DEMO / PLACEHOLDER copy
// written for the redesign direction in the modernization plan — replace it
// with business-approved wording (plan phase 0D) before launch.

export const site = {
  name: "Pixel IT Center",
  url: "https://pixelitcenter.com",
  portalUrl: "https://portal.pixelitcenter.com",
  description:
    "Pixel IT Center delivers technology services and specialized IT talent — cloud, data, AI, cybersecurity, DevOps and staffing — for teams building what's next.",
  // TODO: replace with the approved contact details.
  contact: {
    email: "info@pixelitcenter.com",
    phone: "+1 (000) 000-0000",
    location: "United States",
  },
} as const;

export const nav = [
  { label: "Home", href: "#top" },
  { label: "Services", href: "#services" },
  { label: "Staffing", href: "#staffing" },
  { label: "About Us", href: "#about" },
  { label: "Careers", href: "#careers" },
  { label: "Contact", href: "#contact" },
] as const;

export const hero = {
  eyebrow: "Technology services · IT staffing",
  /** Each entry is one line; `outline` renders the line as outlined text. */
  headline: [
    { text: "Technology", outline: true },
    { text: "& Talent", outline: false },
    { text: "Built for", outline: false },
    { text: "What's Next", outline: false },
  ],
  /** Rendered with **bold** segments highlighted. */
  description:
    "We help companies **modernize their technology** and **build stronger teams** — from cloud and data to the specialists who deliver it.",
  primaryCta: { label: "Talk to our team", href: "#contact" },
  secondaryCta: { label: "Explore services", href: "#services" },
} as const;

// Placeholder slots until approved client logos are collected (plan phase 0A).
export const clientProof = {
  title: "Trusted by teams across industries",
  logos: ["Client logo", "Client logo", "Client logo", "Client logo", "Client logo", "Client logo"],
} as const;

export const services = {
  eyebrow: "Services",
  title: "Two ways we help you move faster",
  groups: [
    {
      name: "Technology Services",
      summary: "Hands-on delivery for the platforms your business runs on.",
      items: [
        { title: "AI & Data", body: "Practical AI use cases, data pipelines and models that reach production." },
        { title: "Cloud — AWS / Azure / GCP", body: "Migration, architecture and cost-aware operations across the major clouds." },
        { title: "Cybersecurity", body: "Assessments, hardening and security built into delivery from day one." },
        { title: "DevOps", body: "CI/CD, infrastructure as code and reliable release pipelines." },
        { title: "QA Automation", body: "Automated test suites that catch regressions before your customers do." },
        { title: "Data & Analytics", body: "Reporting and analytics your teams can trust and act on." },
        { title: "Networking / Infrastructure", body: "Stable, secure networks and infrastructure that scale with you." },
      ],
    },
    {
      name: "Talent & Delivery",
      summary: "The right people, on the right projects, when you need them.",
      items: [
        { title: "IT Staffing", body: "Pre-screened technology professionals matched to your stack and culture." },
        { title: "Contract Staffing", body: "Flexible capacity for projects, peaks and specialist gaps." },
        { title: "Professional Services", body: "Outcome-based engagements delivered by an accountable team." },
        { title: "Project / Program Support", body: "Experienced managers who keep delivery on scope and on time." },
        { title: "Business Analysis", body: "Clear requirements that connect business goals to technical work." },
        { title: "Specialized Technology Talent", body: "Hard-to-find skills sourced through a focused network." },
      ],
    },
  ],
} as const;

export const staffing = {
  eyebrow: "Staffing & consulting",
  title: "One partner for the work and the people behind it",
  body: "Some needs call for a delivery team, others for a single specialist. We do both — so you can scale up, fill a gap or hand over a full project without juggling vendors.",
  points: [
    { title: "Staff augmentation", body: "Add vetted engineers to your team in weeks, not months." },
    { title: "Managed delivery", body: "Hand us a defined outcome; we own the plan and the result." },
    { title: "Direct hire", body: "Find long-term team members with the skills and fit you need." },
  ],
} as const;

export const whyUs = {
  eyebrow: "Why Pixel IT Center",
  title: "Built around clarity and accountability",
  reasons: [
    { title: "Technical depth", body: "Consultants and recruiters who understand the technology they deliver." },
    { title: "Right-fit matching", body: "Candidates screened for skills, communication and team fit." },
    { title: "Transparent engagement", body: "Clear scope, regular updates and no surprises on cost." },
    { title: "Long-term partnership", body: "We measure success by the relationships that last." },
  ],
} as const;

export const process = {
  eyebrow: "How we work",
  title: "A simple delivery process",
  steps: [
    { title: "Discover", body: "We learn your goals, constraints and what success looks like." },
    { title: "Plan", body: "We agree on scope, team shape and timeline." },
    { title: "Deliver", body: "Our people start work with regular check-ins and reporting." },
    { title: "Support", body: "We stay involved to keep results on track as you grow." },
  ],
} as const;

export const about = {
  eyebrow: "About us",
  title: "A technology partner focused on people",
  body: "Pixel IT Center brings together technology services and IT talent under one roof. Our mission is to help organizations deliver technology with confidence by pairing them with the right expertise at the right time.",
  // Placeholder — confirm with the business before publishing any figures.
  highlights: [
    { label: "Focus", value: "Technology & talent" },
    { label: "Delivery", value: "Onshore teams" },
    { label: "Engagements", value: "Project to long-term" },
  ],
} as const;

// Placeholder — replace with approved client testimonials (plan phase 0A).
export const testimonials = {
  eyebrow: "Proof points",
  title: "What clients say",
  items: [
    { quote: "Approved client testimonial goes here. Keep it specific and short.", name: "Client name", role: "Title, Company" },
    { quote: "A second testimonial that speaks to delivery quality or responsiveness.", name: "Client name", role: "Title, Company" },
    { quote: "A third testimonial about staffing fit or long-term partnership.", name: "Client name", role: "Title, Company" },
  ],
} as const;

export const careers = {
  title: "Build your career with us",
  body: "We're always looking for engineers, analysts and technology specialists.",
  cta: { label: "View open roles", href: "#contact" },
} as const;

export const contactCta = {
  eyebrow: "Contact",
  title: "Let's talk about your next project",
  body: "Tell us what you're building or who you need. We'll get back to you within one business day.",
  primary: { label: "Contact our team", href: `mailto:${site.contact.email}` },
  secondary: { label: "Call us", href: `tel:${site.contact.phone.replace(/[^+\d]/g, "")}` },
} as const;

export const footer = {
  columns: [
    {
      title: "Services",
      links: [
        { label: "AI & Data", href: "#services" },
        { label: "Cloud", href: "#services" },
        { label: "Cybersecurity", href: "#services" },
        { label: "DevOps", href: "#services" },
        { label: "IT Staffing", href: "#staffing" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "#about" },
        { label: "Careers", href: "#careers" },
        { label: "Contact", href: "#contact" },
        { label: "Portal Login", href: site.portalUrl },
      ],
    },
  ],
  legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ],
} as const;
