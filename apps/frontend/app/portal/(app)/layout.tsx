import { DashboardShell } from "@/themes/core/components/dashboard/DashboardShell";

// Every signed-in portal page: sidebar + top bar around the page.
export default function DashboardLayout({ children }: LayoutProps<"/portal">) {
  return <DashboardShell>{children}</DashboardShell>;
}
