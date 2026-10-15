import type { AccountType, StaffRole } from "@/content/portal-demo";
import {
  Building2,
  BriefcaseBusiness,
  CalendarDays,
  Clock,
  FileText,
  FileUser,
  Handshake,
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  Mic,
  ReceiptText,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

// The dashboard's sidebar. Students get their own menu (the student corner);
// employees get the universal one, plus the Client section if they have a
// staff role. Clients and vendors never sign in, so there is no client menu.

export type NavItem = { href: string; label: string; icon: LucideIcon; count?: number };

/**
 * The client section (internal, admin only): which staff roles see each page.
 * The API enforces the same rules on every request; this only shapes the menu.
 */
export const clientSectionPages: (NavItem & { roles: StaffRole[]; group?: "Recruiting" | "Admin" })[] = [
  { href: "/portal/admin/panel", label: "Admin panel", icon: ShieldCheck, roles: ["admin"], group: "Admin" },
  { href: "/portal/admin/talent", label: "Talent", icon: UsersRound, roles: ["admin", "recruiter"], group: "Recruiting" },
  { href: "/portal/admin/clients", label: "Clients", icon: Building2, roles: ["admin", "accounts"] },
  { href: "/portal/admin/placements", label: "Placements", icon: Handshake, roles: ["admin", "accounts", "verifier", "recruiter"] },
  { href: "/portal/admin/timesheets", label: "Timesheets", icon: Clock, roles: ["admin", "verifier", "accounts"] },
  { href: "/portal/admin/billing", label: "Billing & invoices", icon: ReceiptText, roles: ["admin", "accounts"] },
];

export function navGroups(staffRole: StaffRole | null = null): { label?: string; items: NavItem[] }[] {
  const mine = staffRole ? clientSectionPages.filter((p) => p.roles.includes(staffRole)) : [];
  const item = ({ href, label, icon }: NavItem) => ({ href, label, icon });
  const recruiting = mine.filter((p) => p.group === "Recruiting").map(item);
  const clientSection = mine.filter((p) => !p.group).map(item);
  const admin = mine.filter((p) => p.group === "Admin").map(item);
  return [
    { items: [{ href: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
    ...(recruiting.length ? [{ label: "Recruiting", items: recruiting }] : []),
    ...(clientSection.length ? [{ label: "Client section", items: clientSection }] : []),
    {
      label: "Your account",
      items: [
        { href: "/portal/messages", label: "Messages", icon: MessageSquare, count: 3 },
        { href: "/portal/documents", label: "Documents", icon: FileText },
        { href: "/portal/profile", label: "Profile", icon: UserRound },
      ],
    },
    {
      label: "Other",
      items: [
        { href: "/portal/support", label: "Support", icon: LifeBuoy },
        { href: "/portal/settings", label: "Settings", icon: Settings },
      ],
    },
    // Last, after Settings: only admins have it.
    ...(admin.length ? [{ label: "Admin", items: admin }] : []),
  ];
}

// Student corner. Students don't apply: PixelIT's recruiters market their
// resume, so the menu is about following that, plus the papers recruiters
// need. Calendar and Help reuse /portal/schedule and /portal/support (they
// show student content). Timesheets only for placed students.
// No learning pages: Pixel IT Center is a recruiting firm, not a course site.
const timesheets: NavItem = { href: "/portal/timesheets", label: "Timesheets", icon: Clock };

export function studentNavGroups(placed: boolean): { label?: string; items: NavItem[] }[] {
  return [
    {
      label: "Get hired",
      items: [
        { href: "/portal/jobs", label: "Jobs", icon: BriefcaseBusiness },
        { href: "/portal/interviews", label: "Interviews", icon: Mic },
        { href: "/portal/schedule", label: "Calendar", icon: CalendarDays },
        { href: "/portal/messages", label: "Messages", icon: MessageSquare, count: 3 },
      ],
    },
    {
      label: "Your profile",
      items: [
        { href: "/portal/resume", label: "Resume", icon: FileUser },
        { href: "/portal/documents", label: "Documents", icon: FileText },
        { href: "/portal/profile", label: "Profile", icon: UserRound },
        ...(placed ? [timesheets] : []),
      ],
    },
    {
      label: "Other",
      items: [
        { href: "/portal/support", label: "Help", icon: LifeBuoy },
        { href: "/portal/settings", label: "Settings", icon: Settings },
      ],
    },
  ];
}

export const navFor = (type: AccountType | null, placed = false, staffRole: StaffRole | null = null) =>
  type === "student" ? studentNavGroups(placed) : navGroups(staffRole);

export const navItemsFor = (type: AccountType | null, placed = false, staffRole: StaffRole | null = null) =>
  navFor(type, placed, staffRole).flatMap((g) => g.items);

// --- route guard (used by DashboardShell) ------------------------------------------

/** Where each account type lands after signing in. Students have no dashboard page. */
export const homeFor = (type: AccountType | null) => (type === "student" ? "/portal/jobs" : "/portal/dashboard");

/** Pages only students can open. Calendar is the student Schedule; staff have no schedule page. */
const STUDENT_ONLY = ["/portal/jobs", "/portal/interviews", "/portal/resume", "/portal/timesheets", "/portal/schedule"];

const under = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

export const isStudentOnly = (path: string) => STUDENT_ONLY.some((href) => under(path, href));

/** Students may open exactly what their menu shows (and the pages under it, e.g. a job). */
export const studentCanOpen = (path: string, placed: boolean) => navItemsFor("student", placed).some((n) => under(path, n.href));

export const isClientSection = (path: string) => under(path, "/portal/admin");

/** Client-section pages need a staff role that the page lists. */
export const staffCanOpen = (path: string, role: StaffRole | null) =>
  !isClientSection(path) || Boolean(role && clientSectionPages.some((p) => under(path, p.href) && p.roles.includes(role)));
