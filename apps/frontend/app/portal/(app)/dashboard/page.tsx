import type { Metadata } from "next";
import { DashboardHome } from "@/themes/core/components/dashboard/DashboardHome";

export const metadata: Metadata = { title: "Dashboard · Portal" };

export default function Page() {
  return <DashboardHome />;
}
