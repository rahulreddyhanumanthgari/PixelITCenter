import type { Metadata } from "next";
import { Onboarding } from "@/components/portal/dashboard/Onboarding";

export const metadata: Metadata = { title: "Complete your profile · Portal" };

// After sign-up: who you are (student / employee / client) and a few details.
export default function OnboardingPage() {
  return (
    <main className="portal-page flex flex-1 px-4 py-10 sm:py-16">
      <Onboarding />
    </main>
  );
}
