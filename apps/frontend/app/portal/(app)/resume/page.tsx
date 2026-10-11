import type { Metadata } from "next";
import { ForType, StudentOnly } from "@/themes/core/components/dashboard/ForType";
import { ResumePage } from "@/themes/core/components/dashboard/student/ResumePage";

export const metadata: Metadata = { title: "Resume corner · Portal" };

export default function Page() {
  return <ForType student={<ResumePage />} other={<StudentOnly />} />;
}
