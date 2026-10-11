import type { Metadata } from "next";
import { ForType } from "@/components/portal/dashboard/ForType";
import { ProjectsPage } from "@/components/portal/dashboard/ProjectsPage";
import { StudentProjects } from "@/components/portal/dashboard/student/StudentProjects";

export const metadata: Metadata = { title: "Projects · Portal" };

export default function Page() {
  return <ForType student={<StudentProjects />} other={<ProjectsPage />} />;
}
