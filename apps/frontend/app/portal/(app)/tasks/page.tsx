import type { Metadata } from "next";
import { TasksPage } from "@/components/portal/dashboard/TasksPage";

export const metadata: Metadata = { title: "Tasks · Portal" };

export default function Page() {
  return <TasksPage />;
}
