import type { Metadata } from "next";
import { ForType, StudentOnly } from "@/components/portal/dashboard/ForType";
import { ResumePage } from "@/components/portal/dashboard/student/ResumePage";

export const metadata: Metadata = { title: "Resume corner · Portal" };

export default function Page() {
  return <ForType student={<ResumePage />} other={<StudentOnly />} />;
}
