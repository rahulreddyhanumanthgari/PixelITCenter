import Home from "@/themes/core/Home";
import { LightHero } from "@/themes/light/hero/LightHero";
import { LightServices } from "@/themes/light/services/LightServices";
import { RibbonLayer } from "@/themes/light/ribbon/RibbonLayer";
import { LightAbout } from "@/themes/light/about/LightAbout";

// The light design (Light Theme reference-animation handoff): every section
// and all copy of the shared site, on a white atmosphere, with one blue
// ribbed tube behind the page that changes shape section by section. Visitors
// who chose it get this at "/" through the rewrite in next.config.ts; /light
// also works directly.
export default function Page() {
  return (
    <Home
      hero={<LightHero />}
      services={<LightServices />}
      about={<LightAbout />}
      particles={false}
      backdrop={<RibbonLayer />}
    />
  );
}
