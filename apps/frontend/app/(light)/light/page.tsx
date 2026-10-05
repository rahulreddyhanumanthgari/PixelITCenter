import Home from "@/themes/core/Home";

// The light design: the dark site's exact page, objects, particle journey,
// animation and scroll behaviour, with the light material layer (white
// environment, strong orange / teal / gold / navy beads; `data-theme="light"`
// in app/(light)/layout.tsx switches the particle engine's material).
// Visitors who chose it get this at "/" through the rewrite in
// next.config.ts; /light also works directly.
export default function Page() {
  return <Home />;
}
