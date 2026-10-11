import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { jobs } from "@/content/student-demo";
import { ForType, StudentOnly } from "@/components/portal/dashboard/ForType";
import { JobDetail } from "@/components/portal/dashboard/student/JobDetail";

// One job's full JD (opened from a job card). Demo data, so every job page
// is built ahead of time.
export function generateStaticParams() {
  return jobs.map((j) => ({ id: j.id }));
}

export async function generateMetadata({ params }: PageProps<"/portal/jobs/[id]">): Promise<Metadata> {
  const { id } = await params;
  const job = jobs.find((j) => j.id === id);
  return { title: job ? `${job.title} · ${job.company} · Portal` : "Job · Portal" };
}

export default async function Page({ params }: PageProps<"/portal/jobs/[id]">) {
  const { id } = await params;
  const job = jobs.find((j) => j.id === id);
  if (!job) notFound();
  return <ForType student={<JobDetail job={job} />} other={<StudentOnly />} />;
}
