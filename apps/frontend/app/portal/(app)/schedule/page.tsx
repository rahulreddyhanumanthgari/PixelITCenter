import type { Metadata } from "next";
import { StudentCalendar } from "@/components/portal/dashboard/student/StudentCalendar";

export const metadata: Metadata = { title: "Schedule · Portal" };

// The student Calendar. Staff have no schedule page any more (the client
// section replaced projects, tasks and schedule); the shell keeps them out.
export default function Page() {
  return <StudentCalendar />;
}
