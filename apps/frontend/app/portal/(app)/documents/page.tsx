import type { Metadata } from "next";
import { ForType } from "@/components/portal/dashboard/ForType";
import { DocumentsPage } from "@/components/portal/dashboard/DocumentsPage";
import { StudentDocuments } from "@/components/portal/dashboard/student/StudentDocuments";

export const metadata: Metadata = { title: "Documents · Portal" };

export default function Page() {
  return <ForType student={<StudentDocuments />} other={<DocumentsPage />} />;
}
