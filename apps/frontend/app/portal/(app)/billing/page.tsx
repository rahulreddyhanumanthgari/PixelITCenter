import type { Metadata } from "next";
import { BillingPage } from "@/components/portal/dashboard/BillingPage";

export const metadata: Metadata = { title: "Billing & invoices · Portal" };

export default function Page() {
  return <BillingPage />;
}
