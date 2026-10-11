import type { Metadata } from "next";
import { ForType, StudentOnly } from "@/themes/core/components/dashboard/ForType";
import { InterviewsPage } from "@/themes/core/components/dashboard/student/InterviewsPage";

export const metadata: Metadata = { title: "Interviews · Portal" };

export default function Page() {
  return <ForType student={<InterviewsPage />} other={<StudentOnly />} />;
}
