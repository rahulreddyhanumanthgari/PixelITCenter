// All homepage copy in one place. In headings, `*word*` marks an important
// word (accent colour) and ` | ` a preferred line break — see HeadingText.
//
// No long dashes (—) in visible copy: they read as machine-written.
//
// Facts and much of the wording come from the live pixelitcenter.com (contact
// details, services, about/mission/vision, recruiting approach, testimonials),
// lightly edited for length and grammar. Copy marked "(own)" is new. Everything here is DEMO / PLACEHOLDER copy
// written for the redesign direction in the modernization plan — replace it
// with business-approved wording (plan phase 0D) before launch.

export const site = {
  name: "Pixel IT Center",
  url: "https://pixelitcenter.com",
  portalUrl: "https://portal.pixelitcenter.com",
  description:
    "Pixel IT Center Corporation delivers IT staffing and technology services in AI, cloud, cybersecurity, big data, DevOps and QA automation for teams building what's next.",
  // From pixelitcenter.com.
  contact: {
    email: "info@pixelitcenter.com",
    phone: "+1 (336) 944-6562",
    location: "189 Tarleton Dr, Fuquay Varina, NC 27526",
  },
  linkedin: "https://www.linkedin.com/company/pixel-it-center/",
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
  /** Each entry is one line (two per row from md up). */
  headline: [{ text: "Technology" }, { text: "& Talent" }, { text: "Built for" }, { text: "What's Next" }],
  /** Headline words in the orange accent ("&" stays white). */
  accentWords: ["Technology", "Talent"] as readonly string[],
  /** **Bold** segments render in the orange accent. */
  description:
    "We help companies **modernize their technology** and **build stronger teams**, from cloud and data to the specialists who deliver it.",
  primaryCta: { label: "Talk to our team", href: "#contact" },
  secondaryCta: { label: "Explore services", href: "#services" },
} as const;

// Client logos carried over from the current pixelitcenter.com "Our Clients"
// section. Files live in public/clients/ (300×150 PNG).
export const clientProof = {
  title: "Trusted by teams across industries",
  logos: [
    { name: "Syntel", src: "/clients/syntel.png" },
    { name: "Adobe", src: "/clients/adobe.png" },
    { name: "Intel", src: "/clients/intel.png" },
    { name: "Mastercard", src: "/clients/mastercard.png" },
    { name: "Costco Wholesale", src: "/clients/costco.png" },
    { name: "Fidelity Investments", src: "/clients/fidelity.png" },
    { name: "MetLife", src: "/clients/metlife.png" },
    { name: "ScriptPro", src: "/clients/scriptpro.png" },
    { name: "Charter Communications", src: "/clients/charter.png" },
    { name: "New York Life", src: "/clients/new-york-life.png" },
    { name: "bp", src: "/clients/bp.png" },
    { name: "Vanguard", src: "/clients/vanguard.png" },
    { name: "BlueCross BlueShield", src: "/clients/bluecross-blueshield.png" },
    { name: "PRA Health Sciences", src: "/clients/pra-health-sciences.png" },
    { name: "Arthrex", src: "/clients/arthrex.png" },
    { name: "Cisco", src: "/clients/cisco.png" },
  ],
} as const;

export const services = {
  eyebrow: "Services",
  title: "Two ways we help you move *faster*",
  groups: [
    {
      name: "Technology Services",
      summary: "Hands-on delivery for the platforms your business runs on.",
      items: [
        { title: "AI", body: "AI consulting and solutions that help you reach your business goals faster and set you up for long-term growth." },
        { title: "Cloud (AWS, Azure, GCP)", body: "AWS expertise, stable Azure hybrid-cloud architectures, and big data and machine learning on GCP." },
        { title: "Cybersecurity", body: "Security services, solutions and risk assessments that stop attacks and meet compliance goals." },
        { title: "Big Data Analytics", body: "Analysis of growing, varied data that gives your business deeper, data-driven insight." },
        { title: "DevOps", body: "Complete DevOps services for any application, from enterprise platforms to consumer products." },
        { title: "QA Automation", body: "A full range of test automation that speeds up testing and saves real money." },
        { title: "Networking Solutions", body: "Network solutions built on robust architecture design, aligned with your business goals." },
      ],
    },
    {
      name: "Talent & Delivery",
      summary: "The right people, on the right projects, when you need them.",
      items: [
        { title: "IT Staffing", body: "Pre-screened technology professionals matched to your stack and culture." },
        { title: "Contract Staffing", body: "Flexible capacity for projects, peaks and specialist gaps." },
        { title: "Professional Services", body: "Outcome-based engagements delivered by an accountable team." },
        { title: "Project Management", body: "Planning, organizing and managing project work to deliver within agreed constraints." },
        { title: "Business Analysis", body: "Analysis that clarifies organizational dynamics and keeps project execution consistent." },
        { title: "Specialized Technology Talent", body: "Hard-to-find skills sourced through a focused network." },
      ],
    },
  ],
} as const;

export const staffing = {
  eyebrow: "Staffing & consulting",
  title: "One partner for the work and the *people* behind it",
  body: "Some needs call for a delivery team, others for a single specialist. We do both, so you can scale up, fill a gap or hand over a full project without juggling vendors.",
  points: [
    { title: "Staff augmentation", body: "Add vetted engineers to your team in weeks, not months." },
    { title: "Managed delivery", body: "Hand us a defined outcome; we own the plan and the result." },
    { title: "Direct hire", body: "Roles matched to your team structure and job descriptions, for a tailored selection." },
  ],
} as const;

export const whyUs = {
  eyebrow: "Why Pixel IT Center",
  title: "Built around *clarity* and accountability",
  reasons: [
    { title: "Technical depth", body: "Recruiters with technical backgrounds and deep experience in the industries they serve." },
    { title: "Right-fit matching", body: "We match on competence, skills and personality, for employers and job seekers alike." },
    { title: "Transparent engagement", body: "Clear scope, regular updates and no surprises on cost." },
    { title: "Long-term partnership", body: "We measure success by the relationships that last." },
  ],
} as const;

export const process = {
  eyebrow: "How we work",
  title: "A simple | *delivery* process",
  steps: [
    { title: "Discover", body: "We learn your goals, constraints and what success looks like." },
    { title: "Plan", body: "We agree on scope, team shape and timeline." },
    { title: "Deliver", body: "Our people start work with regular check-ins and reporting." },
    { title: "Support", body: "We stay involved to keep results on track as you grow." },
  ],
} as const;

export const about = {
  eyebrow: "About us",
  title: "A technology *partner* focused on people",
  body: "Technology is the main inspiration for how we solve problems and adapt to what our customers need. Our mission is to address our clients' technology needs and business problems through innovative, exceptional IT expertise.",
  highlights: [
    { label: "Focus", value: "IT staffing & services" },
    { label: "Approach", value: "Consultative matching" },
    { label: "Based in", value: "North Carolina, USA" },
  ],
  /** From the live site's Vision, shortened. */
  vision:
    "To be a technology-driven, customer-centric, employee-focused IT partner that exceeds expectations on quality, budget and time.",
} as const;

// Placeholder — replace with approved client testimonials (plan phase 0A).
export const testimonials = {
  title: "What *clients* say",
  // From the live site (pixelitcenter.com, "Pixel IT Center Corporation
  // Testimonials"), word for word. It lists first names only.
  items: [
    { quote: "Pixel IT is the best general staffing company in USA, it is well known for IT staffing services.", name: "Lincoln" },
    { quote: "The Pixel IT team are highly professional and understand your project timing which makes them valued partners.", name: "Rakesh" },
    {
      quote:
        "Pixel IT is the best staffing company in USA as a client, we really appreciate the hard work and effort that Pixel IT puts into every assignment they work on.",
      name: "Samuel",
    },
  ],
} as const;

export const careers = {
  eyebrow: "Careers",
  title: "Build your *career* with us",
  body: "We're always looking for engineers, analysts and technology specialists.",
  cta: { label: "View open roles", href: "#contact" },
} as const;

export const contactCta = {
  eyebrow: "Contact",
  title: "Let's talk about | your next | *project*",
  body: "Tell us what you're building or who you need. We'll get back to you within one business day.",
  primary: { label: "Contact our team", href: `mailto:${site.contact.email}` },
  secondary: { label: "Call us", href: `tel:${site.contact.phone.replace(/[^+\d]/g, "")}` },
} as const;

export const footer = {
  columns: [
    {
      title: "Services",
      links: [
        { label: "AI", href: "#services" },
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
        { label: "LinkedIn", href: site.linkedin },
      ],
    },
  ],
  legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ],
} as const;
