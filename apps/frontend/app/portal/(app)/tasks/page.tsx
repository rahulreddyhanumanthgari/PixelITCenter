import type { Metadata } from "next";
import { TasksPage } from "@/themes/core/components/dashboard/TasksPage";

export const metadata: Metadata = { title: "Tasks · Portal" };

export default function Page() {
  return <TasksPage />;
}
