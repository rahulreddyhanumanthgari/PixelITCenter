import type { Metadata } from "next";
import { ProfilePage } from "@/themes/core/components/dashboard/ProfilePage";

export const metadata: Metadata = { title: "Profile · Portal" };

export default function Page() {
  return <ProfilePage />;
}
