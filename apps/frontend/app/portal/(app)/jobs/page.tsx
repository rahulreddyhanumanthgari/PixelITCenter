import type { Metadata } from "next";
import { JobsPage } from "@/components/portal/dashboard/student/JobsPage";

export const metadata: Metadata = { title: "Jobs · Portal" };

// Students only (the dashboard shell's role guard keeps everyone else out).
export default function Page() {
  return <JobsPage />;
}
