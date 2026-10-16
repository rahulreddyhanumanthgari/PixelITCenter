import type { Metadata } from "next";
import { ProfilePage } from "@/components/portal/dashboard/ProfilePage";

export const metadata: Metadata = { title: "Profile · Portal" };

export default function Page() {
  return <ProfilePage />;
}
