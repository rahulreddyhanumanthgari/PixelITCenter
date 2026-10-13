import type { Metadata } from "next";
import { Suspense } from "react";
import { ForType, StudentOnly } from "@/components/portal/dashboard/ForType";
import { JobsPage } from "@/components/portal/dashboard/student/JobsPage";

export const metadata: Metadata = { title: "Jobs · Portal" };

// Suspense: JobsPage reads ?tab= from the URL.
export default function Page() {
  return (
    <Suspense>
      <ForType student={<JobsPage />} other={<StudentOnly />} />
    </Suspense>
  );
}
