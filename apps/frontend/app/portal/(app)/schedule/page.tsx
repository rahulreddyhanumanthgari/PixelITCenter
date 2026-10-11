import type { Metadata } from "next";
import { studentEvents } from "@/content/student-demo";
import { ForType } from "@/components/portal/dashboard/ForType";
import { SchedulePage } from "@/components/portal/dashboard/SchedulePage";

export const metadata: Metadata = { title: "Schedule · Portal" };

export default function Page() {
  return (
    <ForType
      student={<SchedulePage title="Calendar" body="Interviews, calls and deadlines." events={studentEvents} />}
      other={<SchedulePage />}
    />
  );
}
