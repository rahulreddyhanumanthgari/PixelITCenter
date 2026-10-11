import type { Metadata } from "next";
import { ForType, StudentOnly } from "@/components/portal/dashboard/ForType";
import { InterviewsPage } from "@/components/portal/dashboard/student/InterviewsPage";

export const metadata: Metadata = { title: "Interviews · Portal" };

export default function Page() {
  return <ForType student={<InterviewsPage />} other={<StudentOnly />} />;
}
