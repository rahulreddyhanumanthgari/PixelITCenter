# Pixel IT Center

The new Pixel IT Center website, built from the
[modernization plan](./Pixel_IT_Center_Website_Modernization_Plan.pdf).

```
apps/
  frontend/     the public website (Next.js): see apps/frontend/README.md
docs/
  workflow.md   branching and release workflow
.github/        CI (lint, type-check, build) and branch rules
```

## Run the website

```bash
cd apps/frontend
npm install
npm run dev          # http://localhost:3000
```

## Contributing

Read [docs/workflow.md](docs/workflow.md) first: feature branch → `develop` → `master`.
