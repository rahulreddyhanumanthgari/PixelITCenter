import type { Metadata } from "next";
import { studentDocuments } from "@/content/student-demo";
import { ForType } from "@/components/portal/dashboard/ForType";
import { DocumentsPage } from "@/components/portal/dashboard/DocumentsPage";

export const metadata: Metadata = { title: "Documents · Portal" };

export default function Page() {
  return (
    <ForType
      student={<DocumentsPage starter={studentDocuments} body="Resumes, certificates, ID, work papers and offers. We remind you before anything expires." />}
      other={<DocumentsPage />}
    />
  );
}
