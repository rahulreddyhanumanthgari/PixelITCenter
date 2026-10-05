import Home from "@/themes/core/Home";
import { LightHero } from "@/themes/light/hero/LightHero";
import { BeadLayer } from "@/themes/light/beads/BeadLayer";

// The light design, rebuilt from the owner's reference video: every section
// and all copy of the shared site, on a white environment, with one
// continuous bead scene behind the page (a rocket that bursts into a cloud
// and re-forms as a satellite, section by section). The dark particle
// journey is off here. Visitors who chose it get this at "/" through the
// rewrite in next.config.ts; /light also works directly.
export default function Page() {
  return <Home hero={<LightHero />} particles={false} backdrop={<BeadLayer />} />;
}
