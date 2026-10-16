import type { Metadata } from "next";
import { PlacementsPage } from "@/components/portal/dashboard/admin/PlacementsPage";

export const metadata: Metadata = { title: "Placements · Portal" };

// Client section (all staff roles; rates only for admin and accounts).
export default function Page() {
  return <PlacementsPage />;
}
