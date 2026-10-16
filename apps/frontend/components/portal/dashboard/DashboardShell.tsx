"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LoaderCircle, LogOut, Menu, MessageSquare, Search, X } from "lucide-react";
import { accountTypes, conversations, documents, notifications, type StaffRole } from "@/content/portal-demo";
import { jobs, studentConversations } from "@/content/student-demo";
import { Logo } from "@/components/site/layout/Logo";
import { StudentOnly } from "./ForType";
import { homeFor, isStudentOnly, navFor, navItemsFor, staffCanOpen, studentCanOpen } from "./nav";
import { isPlaced, notificationsOf, pixelitIdOf, profileCompletion, signOut, updateSession, useSession, type Session } from "./session";
import { joinTeam, useStaffRole } from "./team";
import { Avatar, Chip } from "./ui";

/**
 * The frame around every dashboard page: sidebar, top bar (search,
 * messages, notifications), the sign-in check (signed out → back to
 * /portal) and the role guard: students open only what their menu shows;
 * everyone else is kept out of the student-only pages, and the client
 * section (/portal/admin/...) opens only for the staff roles each page lists.
 *
 * This guard only shapes the UI. The API enforces the same rules on every
 * request from the role in the token (apps/backend/src/routes/clientSection.ts).
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const student = session?.profile.accountType === "student";
  const home = student && pathname === "/portal/dashboard";
  const role = useStaffRole();
  const employee = session?.profile.accountType === "employee" ? session.profile : null;

  // A new employee joins the team with no access; an admin gives it.
  useEffect(() => {
    if (employee?.email) joinTeam(employee.email, employee.fullName);
  }, [employee?.email, employee?.fullName]);

  useEffect(() => {
    if (session === null) router.replace("/portal");
    // Students have no dashboard page: their home is Jobs.
    else if (home) router.replace(homeFor("student"));
  }, [session, router, home]);

  // Close the phone drawer after following a link.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  if (!session || home) {
    return (
      <div className="dash-app grid place-items-center">
        <LoaderCircle className="size-6 animate-spin text-[var(--dash-orange)]" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="dash-app">
      <Sidebar session={session} open={open} onClose={() => setOpen(false)} pathname={pathname} />
      {open && <div className="dash-scrim lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}
      <div className="dash-body">
        <Topbar session={session} onMenu={() => setOpen(true)} />
        <main className="mx-auto w-full max-w-[84rem] px-4 pt-6 pb-16 sm:px-6 lg:px-8 lg:pt-8">
          {student ? (
            studentCanOpen(pathname, isPlaced(session)) ? children : <NotInYourPortal />
          ) : isStudentOnly(pathname) ? (
            <StudentOnly />
          ) : staffCanOpen(pathname, role) ? (
            children
          ) : (
            <StaffOnly hasAccess={Boolean(role)} />
          )}
        </main>
      </div>
    </div>
  );
}

/** A student opened a page that isn't theirs (or Timesheets before being placed). */
function NotInYourPortal() {
  return (
    <div className="dash-card dash-card-pad mx-auto mt-10 max-w-md text-center">
      <p className="text-base font-semibold">This page isn&apos;t part of your portal</p>
      <p className="mt-2 text-sm text-[var(--dash-muted)]">Use the menu to find your jobs, interviews, resume and documents.</p>
      <Link href={homeFor("student")} className="dash-btn mt-4">
        Go to Jobs
      </Link>
    </div>
  );
}

/** A staff page opened without the access it needs. */
function StaffOnly({ hasAccess }: { hasAccess: boolean }) {
  return (
    <div className="dash-card dash-card-pad mx-auto mt-10 max-w-md text-center">
      <p className="text-base font-semibold">This page is for PixelIT staff with access</p>
      <p className="mt-2 text-sm text-[var(--dash-muted)]">
        {hasAccess
          ? "Your access doesn't include this page. Ask an admin if you need it."
          : "You don't have access to staff pages yet. An admin gives access from the Admin panel."}
      </p>
      <Link href="/portal/dashboard" className="dash-btn mt-4">
        Go to the dashboard
      </Link>
    </div>
  );
}

function Sidebar({
  session,
  open,
  onClose,
  pathname,
}: {
  session: Session;
  open: boolean;
  onClose: () => void;
  pathname: string;
}) {
  const router = useRouter();
  const { profile } = session;
  const type = accountTypes.find((t) => t.id === profile.accountType);
  const role = useStaffRole();
  const percent = profileCompletion(profile);

  return (
    <aside className="dash-sidebar" data-open={open || undefined} aria-label="Portal menu">
      <div className="flex items-center justify-between px-2">
        <Link href="/" aria-label="Pixel IT Center website">
          <Logo alt="" className="h-8 lg:h-9" />
        </Link>
        <button type="button" onClick={onClose} className="dash-icon-btn lg:hidden" aria-label="Close menu">
          <X className="size-4" />
        </button>
      </div>

      <Link href="/portal/profile" className="dash-account mt-5">
        <Avatar name={profile.fullName || profile.email} size={34} photo={session.photo} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{profile.fullName || profile.email}</span>
          {profile.accountType === "employee" ? (
            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--dash-muted)]">
              <Chip tone={role === "admin" ? "warn" : "ink"}>{role === "admin" ? "Admin" : "Employee"}</Chip>
              PixelIT staff
            </span>
          ) : (
          <span className="block truncate text-xs text-[var(--dash-muted)]">
            {pixelitIdOf(session)
                ? `${pixelitIdOf(session)} · ${type?.label ?? "Student"}`
                : type
                  ? `${type.label} account`
                  : "Account type not set"}
          </span>
          )}
        </span>
      </Link>

      <nav className="mt-3 flex-1">
        {navFor(profile.accountType, isPlaced(session), role).map((g, i) => (
          <div key={g.label ?? i}>
            {g.label && <p className="dash-group-label">{g.label}</p>}
            <ul className="space-y-0.5">
              {g.items.map(({ href, label, icon: Icon, count }) => (
                <li key={href}>
                  <Link href={href} className="dash-nav-link" aria-current={pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined}>
                    <Icon className="size-[1.1rem]" aria-hidden="true" />
                    {label}
                    {count ? <span className="dash-nav-count">{count}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="dash-card mt-6 p-3.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold">Profile</span>
          <span className="text-[var(--dash-muted)]">{percent}% complete</span>
        </div>
        <div className="dash-bar mt-2.5">
          <span style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2.5 text-xs leading-relaxed text-[var(--dash-muted)]">
          Demo portal. Sign-in isn&apos;t connected yet.
        </p>
        <button
          type="button"
          className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[var(--dash-orange-ink)] hover:underline"
          onClick={() => {
            signOut();
            router.replace("/portal");
          }}
        >
          <LogOut className="size-3.5" aria-hidden="true" /> Sign out
        </button>
      </div>
    </aside>
  );
}

/** Close a popover on outside click or Escape. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

// What the search box can find: pages and documents (pages and jobs for
// students). Students get the student corner's own content.
function searchIndex(student: boolean, placed: boolean, role: StaffRole | null) {
  const pages = navItemsFor(student ? "student" : null, placed, role).map((n) => ({ label: n.label, hint: "Page", href: n.href }));
  if (student) return [...pages, ...jobs.map((j) => ({ label: j.title, hint: `Job · ${j.company}`, href: `/portal/jobs/${j.id}` }))];
  return [...pages, ...documents.map((d) => ({ label: d.name, hint: `Document · ${d.category}`, href: "/portal/documents" }))];
}

function Topbar({ session, onMenu }: { session: Session; onMenu: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [bellOpen, setBellOpen] = useState(false);
  const closeBell = () => setBellOpen(false);
  const bellRef = useDismiss(bellOpen, closeBell);
  const searchRef = useDismiss(query !== "", () => setQuery(""));

  const student = session.profile.accountType === "student";
  const role = useStaffRole();
  const q = query.trim().toLowerCase();
  const results = q ? searchIndex(student, isPlaced(session), role).filter((r) => r.label.toLowerCase().includes(q)).slice(0, 6) : [];
  // Students: interview scheduled, resume feedback, resume status, timesheet
  // status. In the portal only for now; email delivery comes later.
  const notes: { id: string; title: string; body: string; time: string; href?: string }[] = student ? notificationsOf(session) : notifications;
  const unread = notes.filter((n) => !session.readNotifications.includes(n.id));
  const unreadMessages = (student ? studentConversations : conversations).reduce((n, c) => n + c.unread, 0);

  return (
    // A div, not <header>: the site's header styles (light.css) target header.
    <div role="banner" className="dash-topbar">
      <button type="button" onClick={onMenu} className="dash-icon-btn lg:hidden" aria-label="Open menu">
        <Menu className="size-4" />
      </button>

      <div className="dash-search" ref={searchRef}>
        <label htmlFor="dash-search" className="sr-only">
          Search the portal
        </label>
        <input
          id="dash-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) {
              router.push(results[0].href);
              setQuery("");
            }
          }}
          placeholder={student ? "Search jobs and pages…" : "Search pages and documents…"}
          autoComplete="off"
        />
        <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[var(--dash-muted)]" aria-hidden="true" />
        {q && (
          <div className="dash-popover left-0 right-auto w-full min-w-[16rem]">
            {results.length ? (
              <ul>
                {results.map((r) => (
                  <li key={r.label}>
                    <Link
                      href={r.href}
                      onClick={() => setQuery("")}
                      className="block rounded-xl px-3 py-2 hover:bg-[var(--dash-hover)]"
                    >
                      <span className="block truncate text-sm font-medium">{r.label}</span>
                      <span className="block text-xs text-[var(--dash-muted)]">{r.hint}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-3 py-2 text-sm text-[var(--dash-muted)]">Nothing matches “{query}”.</p>
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Link href="/portal/messages" className="dash-icon-btn" aria-label={`Messages, ${unreadMessages} unread`}>
          <MessageSquare className="size-4" />
          <span className="dash-dot">{unreadMessages}</span>
        </Link>

        <div className="relative" ref={bellRef}>
          <button
            type="button"
            className="dash-icon-btn"
            aria-label={`Notifications, ${unread.length} unread`}
            aria-expanded={bellOpen}
            onClick={() => setBellOpen((v) => !v)}
          >
            <Bell className="size-4" />
            {unread.length > 0 && <span className="dash-dot">{unread.length}</span>}
          </button>
          {bellOpen && (
            <div className="dash-popover">
              <div className="flex items-center justify-between px-2.5 py-1.5">
                <p className="text-sm font-semibold">Notifications</p>
                <button
                  type="button"
                  className="text-xs font-semibold text-[var(--dash-orange-ink)] hover:underline disabled:opacity-40"
                  disabled={!unread.length}
                  onClick={() => updateSession((s) => ({ ...s, readNotifications: [...s.readNotifications, ...notes.map((n) => n.id)] }))}
                >
                  Mark all read
                </button>
              </div>
              <ul>
                {notes.map((n) => {
                  const isUnread = !session.readNotifications.includes(n.id);
                  const body = (
                    <>
                      <span
                        className="mt-1.5 size-2 flex-none rounded-full"
                        style={{ background: isUnread ? "var(--dash-orange)" : "transparent" }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex justify-between gap-2 text-sm font-semibold">
                          {n.title}
                          <span className="text-xs font-normal text-[var(--dash-faint)]">{n.time}</span>
                        </span>
                        <span className="block text-sm text-[var(--dash-muted)]">{n.body}</span>
                      </span>
                    </>
                  );
                  return (
                    <li key={n.id}>
                      {n.href ? (
                        <Link
                          href={n.href}
                          className="flex gap-3 rounded-xl px-2.5 py-2.5 hover:bg-[var(--dash-hover)]"
                          onClick={() => {
                            closeBell();
                            updateSession((s) => ({ ...s, readNotifications: [...s.readNotifications, n.id] }));
                          }}
                        >
                          {body}
                        </Link>
                      ) : (
                        <div className="flex gap-3 rounded-xl px-2.5 py-2.5">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <Link href="/portal/profile" className="hidden sm:block" aria-label="Your profile">
          <Avatar name={session.profile.fullName || session.profile.email} size={40} photo={session.photo} />
        </Link>
      </div>
    </div>
  );
}
