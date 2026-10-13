"use client";

import { studentEvents } from "@/content/student-demo";
import { SchedulePage } from "../SchedulePage";
import { addAvailability, availabilityOf, removeAvailability, useSession } from "../session";

/** The student's Calendar: PixelIT calls, interviews and prep calls, plus their "I'm available" slots. */
export function StudentCalendar() {
  const session = useSession();
  if (!session) return null;
  return (
    <SchedulePage
      title="Calendar"
      body="PixelIT calls, interviews and prep calls, plus the times you're free for interviews."
      events={studentEvents}
      availability={{ slots: availabilityOf(session), onAdd: addAvailability, onRemove: removeAvailability }}
    />
  );
}
