import type { Metadata } from "next";
import { BillingAdminPage } from "@/components/portal/dashboard/admin/BillingAdminPage";

export const metadata: Metadata = { title: "Billing & invoices · Portal" };

// Client section (admin, accounts).
export default function Page() {
  return <BillingAdminPage />;
}
