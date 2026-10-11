import type { Metadata } from "next";
import { MessagesPage } from "@/themes/core/components/dashboard/MessagesPage";

export const metadata: Metadata = { title: "Messages · Portal" };

export default function Page() {
  return <MessagesPage />;
}
