import type { Metadata } from "next";
import { TimesheetsAdminPage } from "@/components/portal/dashboard/admin/TimesheetsAdminPage";

export const metadata: Metadata = { title: "Timesheets · Client section · Portal" };

// Client section (admin, verifier, accounts). Not the student's /portal/timesheets.
export default function Page() {
  return <TimesheetsAdminPage />;
}
