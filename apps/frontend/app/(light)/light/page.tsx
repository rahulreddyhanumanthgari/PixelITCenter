import Home from "@/themes/core/Home";
import { LightHero } from "@/themes/light/hero/LightHero";

// The light design: the shared site with the light hero and, for now, no
// particles at all. Visitors who chose it get this at "/" through the
// rewrite in next.config.ts; /light also works directly.
export default function Page() {
  return <Home hero={<LightHero />} particles={false} />;
}
