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

## Design

The site has one design: the Pixel IT particle site in light colours (the
dark version was retired on 2026-10-08). `app/layout.tsx` loads
`themes/core/core.css` (structure) and `themes/light/light.css` (colours and
light-specific styles) and sets `<html data-theme="light">`, which the
particle scene reads to draw solid ink-coloured cubes on white, no bloom.

## Folders

```
app/            root layout, "/" (page.tsx), not-found, sitemap, robots, icon
themes/
  core/         the site: Home.tsx, core.css (type, cards, footer), fonts.ts,
                components/ (hero, journey, particles, story, layout,
                sections, ui), lib/ (particle forms, gsap), hooks/, shaders/
  light/        colours (light.css) and the light sections: Services,
                Staffing, Why, card entrance
content/        ALL site copy (site.ts): edit text here, not in components
lib/            metadata, utils
types/          ambient type declarations (e.g. *.glsl imports)
public/         static files: brand logo, client logos
docs/           decisions.md: why each part works the way it does
```

## Tuning the particles

Every visual number for the particle journey is in
[`themes/core/components/journey/journey-config.ts`](themes/core/components/journey/journey-config.ts);
the shapes themselves are in `themes/core/lib/particles/`, and their motion
and colour in `themes/core/shaders/particle.vert.glsl`.
