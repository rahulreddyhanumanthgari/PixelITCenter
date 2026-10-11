import type { Metadata } from "next";
import { studentContacts, studentFaqs } from "@/content/student-demo";
import { ForType } from "@/themes/core/components/dashboard/ForType";
import { SupportPage } from "@/themes/core/components/dashboard/SupportPage";

export const metadata: Metadata = { title: "Support · Portal" };

export default function Page() {
  return <ForType student={<SupportPage title="Help" faqs={studentFaqs} people={studentContacts} />} other={<SupportPage />} />;
}
