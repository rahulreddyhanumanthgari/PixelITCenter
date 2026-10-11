"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown, Lightbulb, Phone, Users, Video } from "lucide-react";
import { interviews, mockInterviews, questionBank } from "@/content/student-demo";
import { Chip, PageHeader, useToast } from "../ui";

/** Real interviews coming up, mock interviews with feedback, and practice questions. */
export function InterviewsPage() {
  const [topic, setTopic] = useState(questionBank[0].topic);
  const [toast, showToast] = useToast();
  const bank = questionBank.find((b) => b.topic === topic) ?? questionBank[0];

  return (
    <div className="space-y-8">
      <PageHeader title="Interviews" body="Get ready, practise with your recruiter, then go in confident.">
        <button type="button" className="dash-btn" data-tone="orange" onClick={() => showToast("Request sent. Hari will offer you a mock interview slot. (Demo)")}>
          Book a mock interview
        </button>
      </PageHeader>

      <section aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading" className="dash-section-title">
          Coming up <span className="dash-count">{interviews.length}</span>
        </h2>
        <ul className="mt-3 grid gap-4 lg:grid-cols-2">
          {interviews.map((i) => (
            <li key={i.id} className="dash-card dash-card-pad">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold">{i.company}</h3>
                  <p className="text-sm text-[var(--dash-muted)]">
                    {i.role} · {i.round}
                  </p>
                </div>
                <Chip>Interview</Chip>
              </div>
              <ul className="mt-4 space-y-1.5 text-sm">
                <li className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-[var(--dash-muted)]" aria-hidden="true" /> {i.when}
                </li>
                <li className="flex items-center gap-2">
                  {i.mode === "Phone" ? <Phone className="size-4 text-[var(--dash-muted)]" aria-hidden="true" /> : <Video className="size-4 text-[var(--dash-muted)]" aria-hidden="true" />}
                  {i.mode}
                </li>
                <li className="flex items-center gap-2">
                  <Users className="size-4 text-[var(--dash-muted)]" aria-hidden="true" /> {i.with}
                </li>
              </ul>
              <p className="mt-4 flex gap-2 rounded-xl bg-[var(--dash-orange-tint)] p-3 text-sm leading-relaxed">
                <Lightbulb className="mt-0.5 size-4 flex-none text-[var(--dash-orange-ink)]" aria-hidden="true" />
                <span>
                  <span className="font-semibold">Prep tip: </span>
                  {i.prep}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="mock-heading" className="dash-card dash-card-pad min-w-0">
          <h2 id="mock-heading" className="dash-section-title">
            Mock interviews
          </h2>
          <ul className="mt-3 divide-y divide-[var(--dash-line)]">
            {mockInterviews.map((m) => (
              <li key={m.id} className="py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <span>
                    <span className="block text-sm font-semibold">{m.topic}</span>
                    <span className="block text-xs text-[var(--dash-muted)]">
                      {m.date} · with {m.with}
                    </span>
                  </span>
                  <Chip>{m.result}</Chip>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--dash-muted)]">“{m.feedback}”</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="bank-heading" className="dash-card dash-card-pad min-w-0">
          <h2 id="bank-heading" className="dash-section-title">
            Practice questions
          </h2>
          <div className="dash-scroll-row mt-3 overflow-x-auto">
            <div className="dash-tabs" role="group" aria-label="Topic">
              {questionBank.map((b) => (
                <button key={b.topic} type="button" className="dash-tab" aria-pressed={topic === b.topic} onClick={() => setTopic(b.topic)}>
                  {b.topic}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2 divide-y divide-[var(--dash-line)]">
            {bank.questions.map((q) => (
              <details key={q} className="group py-1">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-2.5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                  {q}
                  <ChevronDown className="size-4 flex-none transition group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="pb-3 text-sm leading-relaxed text-[var(--dash-muted)]">
                  Say it out loud in under two minutes, with one example from your projects. Your recruiter adds model answers here.
                </p>
              </details>
            ))}
          </div>
        </section>
      </div>
      {toast}
    </div>
  );
}
