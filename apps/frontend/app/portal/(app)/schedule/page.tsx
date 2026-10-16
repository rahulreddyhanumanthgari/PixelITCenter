import type { Metadata } from "next";
import { ForType } from "@/components/portal/dashboard/ForType";
import { SchedulePage } from "@/components/portal/dashboard/SchedulePage";
import { StudentCalendar } from "@/components/portal/dashboard/student/StudentCalendar";

export const metadata: Metadata = { title: "Schedule · Portal" };

export default function Page() {
  return <ForType student={<StudentCalendar />} other={<SchedulePage />} />;
}
