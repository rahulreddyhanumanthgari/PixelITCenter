import {
  CalendarDays,
  CreditCard,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  MessageSquare,
  Settings,
  UserRound,
  type LucideIcon,
} from "lucide-react";

// The dashboard's sidebar. Universal for now: every account type sees the
// same pages. Per-type menus (student / employee / client) come later.

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

export const allNavItems = navGroups.flatMap((g) => g.items);
