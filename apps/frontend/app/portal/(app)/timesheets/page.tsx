import type { Metadata } from "next";
import { TimesheetsPage } from "@/components/portal/dashboard/student/TimesheetsPage";

export const metadata: Metadata = { title: "Timesheets · Portal" };

// Placed students only: the dashboard shell's guard hides this page and its
// menu item from everyone else.
export default function Page() {
  return <TimesheetsPage />;
}
