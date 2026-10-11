import { TaskList } from "./TaskList";
import { PageHeader } from "./ui";

/** All tasks, with a box to add more. */
export function TasksPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Tasks" body="Things to do. Tick them off as you go." />
      <div className="dash-card dash-card-pad max-w-3xl">
        <TaskList adding />
      </div>
    </div>
  );
}
