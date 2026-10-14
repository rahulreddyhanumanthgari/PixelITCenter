import type { Metadata } from "next";
import { DashboardHome } from "@/components/portal/dashboard/DashboardHome";

export const metadata: Metadata = { title: "Dashboard · Portal" };

// Employees (staff see the client-section queue). Students have no dashboard page: the shell sends them to Jobs.
export default function Page() {
  return <DashboardHome />;
}
