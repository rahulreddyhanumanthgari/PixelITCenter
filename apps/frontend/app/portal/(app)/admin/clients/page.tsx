import type { Metadata } from "next";
import { ClientsPage } from "@/components/portal/dashboard/admin/ClientsPage";

export const metadata: Metadata = { title: "Clients · Portal" };

// Client section (admin, accounts). The shell keeps everyone else out; the API checks the role too.
export default function Page() {
  return <ClientsPage />;
}
