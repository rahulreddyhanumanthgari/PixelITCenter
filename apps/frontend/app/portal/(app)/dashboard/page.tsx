import type { Metadata } from "next";
import { ForType } from "@/themes/core/components/dashboard/ForType";
import { DashboardHome } from "@/themes/core/components/dashboard/DashboardHome";
import { StudentHome } from "@/themes/core/components/dashboard/student/StudentHome";

export const metadata: Metadata = { title: "Dashboard · Portal" };

export default function Page() {
  return <ForType student={<StudentHome />} other={<DashboardHome />} />;
}
