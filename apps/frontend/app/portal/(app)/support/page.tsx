import type { Metadata } from "next";
import { officeHours, studentContacts, studentFaqs } from "@/content/student-demo";
import { ForType } from "@/components/portal/dashboard/ForType";
import { SupportPage } from "@/components/portal/dashboard/SupportPage";

export const metadata: Metadata = { title: "Support · Portal" };

// Students' tickets go to the admin side.
// TODO(backend): POST /api/student/tickets; admins list and answer them.
export default function Page() {
  return (
    <ForType
      student={
        <SupportPage
          title="Help"
          faqs={studentFaqs}
          people={studentContacts}
          hours={officeHours}
          detailLabel="Description"
          ticketTitle="Raise a ticket"
          ticketsNote="Your recruiter and the PixelIT admin team see your tickets."
        />
      }
      other={<SupportPage />}
    />
  );
}
