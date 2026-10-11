import type { Metadata } from "next";
import { ProjectsPage } from "@/themes/core/components/dashboard/ProjectsPage";

export const metadata: Metadata = { title: "Projects · Portal" };

export default function Page() {
  return <ProjectsPage />;
}
