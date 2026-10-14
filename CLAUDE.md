# Pixel IT Center

Public website and (prototype) portal. Plan: `docs/Pixel_IT_Center_Website_Modernization_Plan.pdf`.
Workflow: `docs/workflow.md`. Frontend details: `apps/frontend/README.md` and `apps/frontend/docs/decisions.md`.

## Keep every file where it belongs

- Each part of the app has one home: frontend in `apps/frontend/`, backend (when it starts) in
  `apps/backend/`. Nothing from one goes in the other or loose at the repo root. Deleting a
  part's folder must remove all of that part and nothing else.
- The repo root holds only repo-wide things: `README.md`, this file, `docs/`, `.github/`, `.claude/`.
- Inside a part, group files by what they are, not by when they were added. A new file goes in
  the folder for its kind; if none fits, create a clearly named folder rather than leaving it loose.
- Moving a file means updating every import, doc and comment that points to it in the same change.
- Never commit generated output (`.next/`, `.next-test/`, build folders, `*.tsbuildinfo`).

## Frontend map (`apps/frontend/`)

| Folder | What goes there |
|---|---|
| `app/` | Routes only: layouts and pages that render components. No logic or styles. |
| `components/site/` | The public website: `Home.tsx`, `layout/`, `hero/`, `sections/`, `ui/`. |
| `components/portal/` | The portal: `login/`, `dashboard/` (shell, pages, demo session), `dashboard/student/`, `dashboard/admin/` (client section, staff only). |
| `animations/` | Anything that moves: `particles/` (scene, shaders, shapes), `journey/`, `story/`, `scroll/`, `gsap.ts`. |
| `content/` | Copy and demo data, no JSX. |
| `styles/` | CSS and fonts. |
| `hooks/`, `lib/`, `types/` | Shared hooks, helpers, type declarations. |
| `public/` | Images and brand files. |
| `docs/` | Frontend decisions (`decisions.md`). |

## Backend

Goes in `apps/backend/` with its own source, tests and config. Talk the plan through with Manas
before writing any. Until then the portal is front end only, with dummy data.
