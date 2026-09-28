# Pixel IT Center — public website

The new public website for Pixel IT Center, built from the
[modernization plan](./Pixel_IT_Center_Website_Modernization_Plan.pdf) (Phase 0).

- **Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui
- **Hero:** real-time 3D particle sculpture — three.js, React Three Fiber, custom GLSL, GSAP ScrollTrigger

> Current state: **demo of Milestone 1** — homepage with header, 3D hero, services,
> staffing, why us, process, about/careers, testimonials, contact CTA and footer.
> All copy, client logos, testimonials and contact details are **placeholders**
> until the business approves them (plan phase 0D).

## Run locally

Requires Node 20+.

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

Don't run `npm run dev` and `npm run build` at the same time — they share `.next/`.

## Where things are

```
app/            routes, layout, metadata, sitemap.ts, robots.ts
components/
  hero/         3D hero (see docs/decisions.md)
  layout/       Header, Footer, Logo, mobile menu
  sections/     homepage sections
  ui/           shadcn/ui components
content/site.ts ALL homepage copy — edit text here, not in components
shaders/        GLSL for the particle sculpture and stars
lib/            helpers (cn, gsap registration)
docs/           workflow and decisions
```

## Tuning the hero

Every visual number (particle counts, size, rotation speed, noise, mouse
influence, bloom, colours, position, scroll amounts) is in
[`components/hero/particle-config.ts`](components/hero/particle-config.ts).

## Contributing

Read [docs/workflow.md](docs/workflow.md) first: feature branch → `develop` → `master`.
