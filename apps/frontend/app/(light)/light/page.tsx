import Home from "@/themes/core/Home";
import { LightHero } from "@/themes/light/hero/LightHero";
import { LightServices } from "@/themes/light/services/LightServices";

// The light design: the shared site with its own hero and Services and, for
// now, no particles. Visitors who chose it get this at "/" through the
// rewrite in next.config.ts; /light also works directly.
export default function Page() {
  return <Home hero={<LightHero />} services={<LightServices />} particles={false} />;
}
