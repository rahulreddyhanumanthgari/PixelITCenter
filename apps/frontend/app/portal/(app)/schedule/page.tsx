import type { Metadata } from "next";
import { SchedulePage } from "@/themes/core/components/dashboard/SchedulePage";

export const metadata: Metadata = { title: "Schedule · Portal" };

export default function Page() {
  return <SchedulePage />;
}
