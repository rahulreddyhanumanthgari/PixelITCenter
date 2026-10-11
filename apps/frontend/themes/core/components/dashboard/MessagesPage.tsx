"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { conversations as starter, type Conversation } from "@/content/portal-demo";
import { Avatar, PageHeader } from "./ui";

/**
 * Conversations on the left, the open thread on the right (on phones: the
 * list, then the thread with a back arrow). Sending adds the message here
 * only; nothing leaves the browser.
 */
export function MessagesPage() {
  const [list, setList] = useState<Conversation[]>(starter);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const thread = useRef<HTMLDivElement>(null);
  const open = list.find((c) => c.id === openId);

  useEffect(() => {
    // Newest message in view, without scrolling the page itself.
    const el = thread.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [openId, open?.messages.length]);

  const choose = (id: string) => {
    setOpenId(id);
    setList((l) => l.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  };

  const send = () => {
    const text = draft.trim();
    if (!text || !open) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setList((l) => l.map((c) => (c.id === open.id ? { ...c, messages: [...c.messages, { from: "me", text, time }] } : c)));
    setDraft("");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Messages" body="Your account manager, recruiter, trainers and support, in one place." />

      <div className="dash-card grid min-h-[32rem] overflow-hidden md:grid-cols-[18rem_minmax(0,1fr)]">
        <ul className={`border-[var(--dash-line)] md:border-r ${open ? "hidden md:block" : ""}`} aria-label="Conversations">
          {list.map((c) => {
            const last = c.messages[c.messages.length - 1];
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => choose(c.id)}
                  aria-current={c.id === openId || undefined}
                  className="flex w-full items-center gap-3 border-b border-[var(--dash-line)] px-4 py-3.5 text-left hover:bg-[var(--dash-hover)] aria-[current]:bg-[var(--dash-side)]"
                >
                  <Avatar name={c.name} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{c.name}</span>
                      <span className="flex-none text-xs text-[var(--dash-faint)]">{last.time}</span>
                    </span>
                    <span className="block truncate text-xs text-[var(--dash-muted)]">{c.role}</span>
                    <span className={`block truncate text-sm ${c.unread ? "font-semibold" : "text-[var(--dash-muted)]"}`}>
                      {last.from === "me" ? "You: " : ""}
                      {last.text}
                    </span>
                  </span>
                  {c.unread > 0 && <span className="dash-nav-count ml-0">{c.unread}</span>}
                </button>
              </li>
            );
          })}
        </ul>

        {open ? (
          <section className="flex min-h-[32rem] flex-col" aria-label={`Conversation with ${open.name}`}>
            <header className="flex items-center gap-3 border-b border-[var(--dash-line)] px-4 py-3">
              <button type="button" className="dash-icon-btn size-9 md:hidden" onClick={() => setOpenId(null)} aria-label="Back to conversations">
                <ArrowLeft className="size-4" />
              </button>
              <Avatar name={open.name} size={36} />
              <div>
                <p className="text-sm font-semibold">{open.name}</p>
                <p className="text-xs text-[var(--dash-muted)]">{open.role}</p>
              </div>
            </header>
            <div ref={thread} className="max-h-[28rem] flex-1 space-y-3 overflow-y-auto bg-[var(--dash-main)] p-4">
              {open.messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === "me" ? "justify-end" : ""}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.from === "me" ? "rounded-br-md bg-[var(--dash-ink)] text-white" : "rounded-bl-md bg-white ring-1 ring-[var(--dash-line)]"
                    }`}
                  >
                    {m.text}
                    <span className={`mt-1 block text-[0.6875rem] ${m.from === "me" ? "text-white/60" : "text-[var(--dash-faint)]"}`}>
                      {m.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <form
              className="flex gap-2 border-t border-[var(--dash-line)] p-3"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <label htmlFor="msg" className="sr-only">
                Message {open.name}
              </label>
              <input id="msg" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Message ${open.name.split(" ")[0]}…`} className="dash-input flex-1" autoComplete="off" />
              <button type="submit" className="dash-btn h-11 w-11 px-0" disabled={!draft.trim()} aria-label="Send">
                <Send className="size-4" />
              </button>
            </form>
          </section>
        ) : (
          <div className="hidden place-items-center p-8 text-center text-sm text-[var(--dash-muted)] md:grid">
            Pick a conversation to read it.
          </div>
        )}
      </div>
    </div>
  );
}
