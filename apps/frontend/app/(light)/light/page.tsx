import Home from "@/themes/core/Home";
import { LightHero } from "@/themes/light/hero/LightHero";
import { LightServices } from "@/themes/light/services/LightServices";

// The light design, per the Light Pixel Master Specification: the dark
// site's page, content and particle journey (data-theme="light" switches the
// engine to voxel pixels in the locked palette and the spec's formations),
// with the hero's typography on the left and Services' content on the left.
// Visitors who chose it get this at "/" through the rewrite in
// next.config.ts; /light also works directly.
export default function Page() {
  return <Home hero={<LightHero />} services={<LightServices />} />;
}
