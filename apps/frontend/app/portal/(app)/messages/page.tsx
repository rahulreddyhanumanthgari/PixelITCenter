import type { Metadata } from "next";
import { studentConversations } from "@/content/student-demo";
import { ForType } from "@/components/portal/dashboard/ForType";
import { MessagesPage } from "@/components/portal/dashboard/MessagesPage";

export const metadata: Metadata = { title: "Messages · Portal" };

export default function Page() {
  return (
    <ForType
      student={<MessagesPage starter={studentConversations} body="Chat with your recruiter, placement lead and support." />}
      other={<MessagesPage />}
    />
  );
}
