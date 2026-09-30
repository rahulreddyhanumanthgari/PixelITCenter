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

## Folders

```
app/            routes, root layout, metadata, sitemap.ts, robots.ts
components/
  hero/         landing hero (h1, copy, CTAs)
  journey/      the page-wide particle journey + its config (journey-config.ts)
  particles/    particle engine: system, morph controller, stars, sky, canvas
  story/        layout + scroll choreography for the story sections
  layout/       header, nav, theme toggle, footer, logo, mobile menu
  sections/     homepage sections (services, staffing, why, process, about…)
  ui/           shared UI: shadcn button, card, heading text, particle icons
content/        ALL site copy (site.ts): edit text here, not in components
hooks/          shared React hooks (device tier, pointer, reduced motion)
lib/            helpers: particle forms/shapes, theme, gsap, utils
shaders/        GLSL for the particles and stars
styles/         globals.css: design tokens, themes, type, cards, footer
types/          ambient type declarations (e.g. *.glsl imports)
public/         static files: brand logo, client logos
docs/           decisions.md: why each part works the way it does
```

## Tuning the particles

Every visual number for the particle journey is in
[`components/journey/journey-config.ts`](components/journey/journey-config.ts);
the shapes themselves are in `lib/particles/`, and their motion and colour in
`shaders/particle.vert.glsl`.
