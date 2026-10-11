import type { Metadata } from "next";
import { DocumentsPage } from "@/themes/core/components/dashboard/DocumentsPage";

export const metadata: Metadata = { title: "Documents · Portal" };

export default function Page() {
  return <DocumentsPage />;
}
