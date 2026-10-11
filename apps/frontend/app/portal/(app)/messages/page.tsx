import type { Metadata } from "next";
import { studentConversations } from "@/content/student-demo";
import { ForType } from "@/themes/core/components/dashboard/ForType";
import { MessagesPage } from "@/themes/core/components/dashboard/MessagesPage";

export const metadata: Metadata = { title: "Messages · Portal" };

export default function Page() {
  return (
    <ForType
      student={<MessagesPage starter={studentConversations} body="Chat with your recruiter, placement lead and support." />}
      other={<MessagesPage />}
    />
  );
}
