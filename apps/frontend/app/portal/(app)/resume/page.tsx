import type { Metadata } from "next";
import { ResumePage } from "@/components/portal/dashboard/student/ResumePage";

export const metadata: Metadata = { title: "Resume corner · Portal" };

// Students only (the dashboard shell's role guard keeps everyone else out).
export default function Page() {
  return <ResumePage />;
}
