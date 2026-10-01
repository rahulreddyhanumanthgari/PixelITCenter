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

Don't run `npm run dev` and `npm run build` at the same time: they share
`.next/`. For a test build next to a running dev server, use
`NEXT_DIST_DIR=.next-test npm run build`.

## Two designs, one switch

The homepage exists in two complete designs while the team picks one. Each
lives in its own folder and shares only the copy (`content/site.ts`) and
`public/`:

| Design | Folder | Route | Look |
|---|---|---|---|
| Dark | `themes/dark/` | `app/(dark)` → `/` | Cinematic particle journey (WebGL) |
| Light | `themes/light/` | `app/(light)` → `/light` | Light, editorial, the logo's teal and a node-network hero |

A floating **Design: Dark / Light** control (`components/DesignSwitch.tsx`)
saves the choice in a cookie; `next.config.ts` then serves the chosen design
at `/`. Both stay statically prerendered. Hide the control with
`NEXT_PUBLIC_DESIGN_SWITCH=off`.

**When a design is chosen:** delete the other `themes/` folder and its
`app/(…)` route group, `components/DesignSwitch.tsx`, `lib/design.ts` and the
rewrite in `next.config.ts`. If light wins, move `app/(light)/light/page.tsx`
up to `app/(light)/page.tsx` so it is served at `/`.

## Folders

```
app/
  (dark)/       root layout + "/" for the dark design
  (light)/      root layout + "/light" for the light design
  global-not-found.tsx, sitemap.ts, robots.ts, icon.png (shared)
themes/
  dark/         the dark design: DarkHome.tsx, dark.css, and its own
                components/ (hero, journey, particles, story, layout, sections, ui),
                lib/ (particle forms, gsap), hooks/, shaders/
  light/        the light design: LightHome.tsx, light.css, components/, lib/
components/     shared: DesignSwitch
content/        ALL site copy (site.ts): edit text here, not in components
lib/            shared: design switch, metadata, utils
types/          ambient type declarations (e.g. *.glsl imports)
public/         static files: brand logo, client logos
docs/           decisions.md: why each part works the way it does
```

## Tuning the particles (dark design)

Every visual number for the particle journey is in
[`themes/dark/components/journey/journey-config.ts`](themes/dark/components/journey/journey-config.ts);
the shapes themselves are in `themes/dark/lib/particles/`, and their motion
and colour in `themes/dark/shaders/particle.vert.glsl`.
