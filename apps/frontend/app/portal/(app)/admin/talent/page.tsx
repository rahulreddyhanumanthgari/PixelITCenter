import type { Metadata } from "next";
import { TalentPage } from "@/components/portal/dashboard/admin/TalentPage";

export const metadata: Metadata = { title: "Talent · Portal" };

// Every registered student, placed or not (admin, recruiter). The shell keeps everyone else out.
export default function Page() {
  return <TalentPage />;
}
