import type { Metadata } from "next";
import { ForType } from "@/themes/core/components/dashboard/ForType";
import { ProjectsPage } from "@/themes/core/components/dashboard/ProjectsPage";
import { StudentProjects } from "@/themes/core/components/dashboard/student/StudentProjects";

export const metadata: Metadata = { title: "Projects · Portal" };

export default function Page() {
  return <ForType student={<StudentProjects />} other={<ProjectsPage />} />;
}
