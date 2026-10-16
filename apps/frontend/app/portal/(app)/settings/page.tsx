import type { Metadata } from "next";
import { SettingsPage } from "@/components/portal/dashboard/SettingsPage";

export const metadata: Metadata = { title: "Settings · Portal" };

export default function Page() {
  return <SettingsPage />;
}
