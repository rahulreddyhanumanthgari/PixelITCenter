import type { Metadata } from "next";
import { Suspense } from "react";
import { ForType, StudentOnly } from "@/themes/core/components/dashboard/ForType";
import { JobsPage } from "@/themes/core/components/dashboard/student/JobsPage";

export const metadata: Metadata = { title: "Jobs · Portal" };

// Suspense: JobsPage reads ?tab= from the URL.
export default function Page() {
  return (
    <Suspense>
      <ForType student={<JobsPage />} other={<StudentOnly />} />
    </Suspense>
  );
}
