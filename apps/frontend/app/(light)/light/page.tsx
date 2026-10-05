import Home from "@/themes/core/Home";
import { LightHero } from "@/themes/light/hero/LightHero";
import { LightServices } from "@/themes/light/services/LightServices";

// The light design: the same site and particle journey as the dark design,
// lit by the sun (data-theme="light" in app/(light)/layout.tsx switches the
// particle engine to its light mode). Its hero is a solar eclipse, with the
// headline on the left (LightHero). Visitors who chose it get this at "/"
// through the rewrite in next.config.ts; /light also works directly.
export default function Page() {
  return <Home hero={<LightHero />} services={<LightServices />} />;
}
