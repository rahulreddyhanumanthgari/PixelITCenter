import type { Metadata } from "next";
import { AdminPanelPage } from "@/components/portal/dashboard/admin/AdminPanelPage";

export const metadata: Metadata = { title: "Admin panel · Portal" };

// Admins only: team and access, portal settings, activity log.
export default function Page() {
  return <AdminPanelPage />;
}
