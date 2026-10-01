import Home from "@/themes/core/Home";
import { LightHero } from "@/themes/light/hero/LightHero";
import { ContactOrb } from "@/themes/light/contact/ContactOrb";

// The light design: the shared site with the light hero and the calm Contact
// orb (Light Theme pack). Visitors who chose it get this at "/" through the
// rewrite in next.config.ts; /light also works directly.
export default function Page() {
  return <Home hero={<LightHero />} contactBackdrop={<ContactOrb />} />;
}
