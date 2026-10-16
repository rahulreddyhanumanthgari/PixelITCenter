# Pixel IT Center — frontend

The public website: Next.js (App Router) · TypeScript · Tailwind CSS ·
shadcn/ui, with a real-time particle journey (three.js, React Three Fiber,
custom GLSL, GSAP ScrollTrigger).

## Run locally

Requires Node 20+. Run everything from this folder (`apps/frontend`).

```bash
npm install
npm run dev          # http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generates route types, then `tsc --noEmit` |
| `npm run build` | Production build |
| `npm start` | Serve the production build |

The student Profile page's **Placement details** section needs the portal API
(`apps/backend`, see its README). Point the site at it with
`NEXT_PUBLIC_PORTAL_API_URL` (default `http://localhost:4000`); without it, that
section shows "Can't reach the placement service" and the rest of the site works.

Don't run `npm run dev` and `npm run build` at the same time: they share
`.next/`. For a test build next to a running dev server, use
`NEXT_DIST_DIR=.next-test npm run build`.

## Design

The site has one design: the Pixel IT particle site in light colours (the
dark version was retired on 2026-10-08). `app/layout.tsx` loads
`styles/core.css` (structure) and `styles/light.css` (colours and
light-specific styles) and sets `<html data-theme="light">`, which the
particle scene reads to draw solid ink-coloured cubes on white, no bloom.

## Folders

```
app/            routes only: layouts, pages, not-found, sitemap, robots, icon
components/
  site/         the website: Home.tsx, layout/ (header, footer, logo),
                hero/, sections/ (incl. services, staffing, why), ui/
  portal/       the portal: login/ (sign-in page), dashboard/ (shell,
                pages, demo session) and dashboard/student/ (student corner)
animations/     everything that moves: particles/ (scene, shaders, shape
                lib), journey/ (scroll journey), story/, scroll/ (card
                entrance, How We Work progress), gsap.ts
content/        ALL copy and demo data (site.ts, portal-demo.ts,
                student-demo.ts): edit text here, not in components
styles/         core.css (type, cards, footer), light.css (colours),
                dashboard.css (portal), fonts.ts
hooks/          shared React hooks (device quality tier)
lib/            metadata, utils
types/          ambient type declarations (e.g. *.glsl imports)
public/         static files: brand logo, client logos
docs/           decisions.md: why each part works the way it does
```

## Tuning the particles

Every visual number for the particle journey is in
[`animations/journey/journey-config.ts`](animations/journey/journey-config.ts);
the shapes themselves are in `animations/particles/lib/`, and their motion
and colour in `animations/particles/shaders/particle.vert.glsl`.
