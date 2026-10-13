import type { Metadata } from "next";
import { ProjectsPage } from "@/components/portal/dashboard/ProjectsPage";

export const metadata: Metadata = { title: "Projects · Portal" };

// Employees and clients only. Students have no Projects page (the shell keeps them out).
export default function Page() {
  return <ProjectsPage />;
}
