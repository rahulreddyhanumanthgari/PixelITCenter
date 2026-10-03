import Home from "@/themes/core/Home";

// The light design: the same site and particle journey as the dark design,
// on a white atmosphere with the particles in bright blues (data-theme="light"
// in app/(light)/layout.tsx switches the particle engine to its light mode).
// The earlier blue square-tube version (themes/light/ribbon, hero, services,
// about) is kept in the repo but not used. Visitors who chose it get this at
// "/" through the rewrite in next.config.ts; /light also works directly.
export default function Page() {
  return <Home />;
}
