import type { AccountType } from "@/content/portal-demo";
import {
  BriefcaseBusiness,
  CalendarDays,
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

// Student corner: get hired, then what you show employers. Calendar and
// Help reuse /portal/schedule and /portal/support (they show student content).
// No learning pages: Pixel IT Center is a recruiting firm, not a course site.
export const studentNavGroups: { label?: string; items: NavItem[] }[] = [
  { items: [{ href: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
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
      { href: "/portal/resume", label: "Resume corner", icon: FileUser },
      { href: "/portal/projects", label: "Projects", icon: FolderKanban },
      { href: "/portal/documents", label: "Documents", icon: FileText },
      { href: "/portal/profile", label: "Profile", icon: UserRound },
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

export const navFor = (type: AccountType | null) => (type === "student" ? studentNavGroups : navGroups);

export const navItemsFor = (type: AccountType | null) => navFor(type).flatMap((g) => g.items);
