import type { Metadata } from "next";
import { studentConversations } from "@/content/student-demo";
import { ForType } from "@/components/portal/dashboard/ForType";
import { MessagesPage } from "@/components/portal/dashboard/MessagesPage";

export const metadata: Metadata = { title: "Messages · Portal" };

// TODO(messaging): front-end placeholder only, for every account type. Nothing
// is sent or received, and no third-party chat service is wired in on purpose:
// whether the messaging backend is built in-house (Node.js, in apps/backend)
// or bought from a third party is pending a cost / effort decision.
export default function Page() {
  return (
    <ForType
      student={<MessagesPage starter={studentConversations} body="Chat with your recruiter, placement lead and support." />}
      other={<MessagesPage />}
    />
  );
}
