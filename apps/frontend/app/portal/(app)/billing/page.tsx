import type { Metadata } from "next";
import { BillingPage } from "@/themes/core/components/dashboard/BillingPage";

export const metadata: Metadata = { title: "Billing & invoices · Portal" };

export default function Page() {
  return <BillingPage />;
}
