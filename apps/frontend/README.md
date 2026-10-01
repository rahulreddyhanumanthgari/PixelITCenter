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

The homepage comes in two designs while the team picks one: the same Pixel IT
particle site, in the dark or in daylight (the light one follows the "Light
Theme Live Team Recreation Pack"). The site itself is shared; each design's
folder holds only what is its own:

| Design | Folder | Route | What the folder holds |
|---|---|---|---|
| Dark | `themes/dark/` | `app/(dark)` → `/` | `dark.css`: the dark colours |
| Light | `themes/light/` | `app/(light)` → `/light` | `light.css` (daylight colours), `LightSky.tsx` (the bright sky behind the particles) |

Each root layout sets `<html data-theme="dark|light">`; the particle scene
reads it to draw glowing points (dark) or ink dots without glow (light).

A floating **Design: Dark / Light** control (`components/DesignSwitch.tsx`)
saves the choice in a cookie; `next.config.ts` then serves the chosen design
at `/`. Both stay statically prerendered. Hide the control with
`NEXT_PUBLIC_DESIGN_SWITCH=off`.

**When a design is chosen:** delete the other `themes/` folder and its
`app/(…)` route group, `components/DesignSwitch.tsx`, `lib/design.ts` and the
rewrite in `next.config.ts`; remove the other branch where the particle code
checks `useTheme()`. If light wins, move `app/(light)/light/page.tsx` up to
`app/(light)/page.tsx` so it is served at `/`.

## Folders

```
app/
  (dark)/       root layout + "/" for the dark design
  (light)/      root layout + "/light" for the light design
  global-not-found.tsx, sitemap.ts, robots.ts, icon.png (shared)
themes/
  core/         the site both designs share: Home.tsx, core.css (type, cards,
                footer), fonts.ts, components/ (hero, journey, particles, story,
                layout, sections, ui), lib/ (particle forms, gsap, theme),
                hooks/, shaders/
  dark/         dark-only: dark.css
  light/        light-only: light.css, LightSky.tsx
components/     shared: DesignSwitch
content/        ALL site copy (site.ts): edit text here, not in components
lib/            shared: design switch, metadata, utils
types/          ambient type declarations (e.g. *.glsl imports)
public/         static files: brand logo, client logos
docs/           decisions.md: why each part works the way it does
```

## Tuning the particles

Every visual number for the particle journey is in
[`themes/core/components/journey/journey-config.ts`](themes/core/components/journey/journey-config.ts);
the shapes themselves are in `themes/core/lib/particles/`, and their motion
and colour in `themes/core/shaders/particle.vert.glsl`.
