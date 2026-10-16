import type { AccountType } from "@/content/portal-demo";
import {
  BriefcaseBusiness,
  CalendarDays,
  Clock,
  CreditCard,
  FileText,
  FileUser,
  FolderKanban,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  MessageSquare,
  Mic,
  Settings,
  UserRound,
  type LucideIcon,
} from "lucide-react";

// The dashboard's sidebar. Students get their own menu (the student
// corner); employees and clients share the universal one for now.

export type NavItem = { href: string; label: string; icon: LucideIcon; count?: number };

export const navGroups: { label?: string; items: NavItem[] }[] = [
  { items: [{ href: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
    label: "Work",
    items: [
      { href: "/portal/projects", label: "Projects", icon: FolderKanban },
      { href: "/portal/messages", label: "Messages", icon: MessageSquare, count: 4 },
      { href: "/portal/schedule", label: "Schedule", icon: CalendarDays },
      { href: "/portal/tasks", label: "Tasks", icon: ListChecks },
    ],
  },
  {
    label: "Your account",
    items: [
      { href: "/portal/documents", label: "Documents", icon: FileText },
      { href: "/portal/billing", label: "Billing & invoices", icon: CreditCard },
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
];

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

export const navFor = (type: AccountType | null, placed = false) => (type === "student" ? studentNavGroups(placed) : navGroups);

export const navItemsFor = (type: AccountType | null, placed = false) => navFor(type, placed).flatMap((g) => g.items);

// --- route guard (used by DashboardShell) ------------------------------------------

/** Where each account type lands after signing in. Students have no dashboard page. */
export const homeFor = (type: AccountType | null) => (type === "student" ? "/portal/jobs" : "/portal/dashboard");

/** Pages only students can open. */
const STUDENT_ONLY = ["/portal/jobs", "/portal/interviews", "/portal/resume", "/portal/timesheets"];

const under = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

export const isStudentOnly = (path: string) => STUDENT_ONLY.some((href) => under(path, href));

/** Students may open exactly what their menu shows (and the pages under it, e.g. a job). */
export const studentCanOpen = (path: string, placed: boolean) => navItemsFor("student", placed).some((n) => under(path, n.href));
