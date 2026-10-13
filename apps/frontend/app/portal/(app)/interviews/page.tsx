import type { Metadata } from "next";
import { InterviewsPage } from "@/components/portal/dashboard/student/InterviewsPage";

export const metadata: Metadata = { title: "Interviews · Portal" };

// Students only (the dashboard shell's role guard keeps everyone else out).
export default function Page() {
  return <InterviewsPage />;
}
