import type { Metadata } from "next";
import { ForType, StudentOnly } from "@/themes/core/components/dashboard/ForType";
import { LearningPage } from "@/themes/core/components/dashboard/student/LearningPage";

export const metadata: Metadata = { title: "Learning · Portal" };

export default function Page() {
  return <ForType student={<LearningPage />} other={<StudentOnly />} />;
}
