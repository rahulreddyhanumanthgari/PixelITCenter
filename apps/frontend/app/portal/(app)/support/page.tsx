import type { Metadata } from "next";
import { SupportPage } from "@/themes/core/components/dashboard/SupportPage";

export const metadata: Metadata = { title: "Support · Portal" };

export default function Page() {
  return <SupportPage />;
}
