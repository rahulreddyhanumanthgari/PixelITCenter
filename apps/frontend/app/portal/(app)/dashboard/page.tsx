import type { Metadata } from "next";
import { ForType } from "@/components/portal/dashboard/ForType";
import { DashboardHome } from "@/components/portal/dashboard/DashboardHome";
import { StudentHome } from "@/components/portal/dashboard/student/StudentHome";

export const metadata: Metadata = { title: "Dashboard · Portal" };

export default function Page() {
  return <ForType student={<StudentHome />} other={<DashboardHome />} />;
}
