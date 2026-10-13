import { Hero } from "@/components/site/hero/Hero";
import { JourneyLayer } from "@/animations/journey/JourneyLayer";
import { ParticleStory } from "@/animations/story/ParticleStory";
import { Header } from "@/components/site/layout/Header";
import { Footer } from "@/components/site/layout/Footer";
import { ClientProof } from "@/components/site/sections/ClientProof";
import { Process } from "@/components/site/sections/Process";
import { About } from "@/components/site/sections/About";
import { Careers } from "@/components/site/sections/Careers";
import { Testimonials } from "@/components/site/sections/Testimonials";
import { ContactCta } from "@/components/site/sections/ContactCta";
import { LightServices } from "@/components/site/sections/services/LightServices";
import { LightStaffing } from "@/components/site/sections/staffing/LightStaffing";
import { LightWhy } from "@/components/site/sections/why/LightWhy";

// Homepage flow from the modernization plan (section 04).
export default function HomePage() {
  return (
    <>
      <Header />
      {/* One particle system for the whole journey, fixed behind the page. */}
      <JourneyLayer />
      {/* Content sits above the particle layer (z-10). The hero, client strip
          and story are transparent so the particles show through, and so is
          the galaxy area after it (About → Contact). */}
      <main className="relative z-10 flex-1">
        <Hero />
        <ClientProof />
        <ParticleStory>
          <LightServices />
          <LightStaffing />
          <LightWhy />
          <Process />
        </ParticleStory>
        {/* About, Careers, Proof Points and Contact share one background: the
            particle galaxy (and the star field) show through them. The
            galaxy's anchor is pinned to the screen while this area scrolls,
            then leaves with it as the footer arrives. */}
        <div data-galaxy-region className="relative">
          <div
            data-galaxy-anchor
            aria-hidden="true"
            className="pointer-events-none sticky top-0 -mb-[100svh] h-[100svh]"
          />
          <About />
          <Careers />
          <Testimonials />
          <ContactCta />
          {/* The ending: space where the galaxy collapses into a small sun
              that settles on the footer's top edge, half hidden by it. */}
          <div data-galaxy-outro aria-hidden="true" className="h-[20svh]" />
        </div>
      </main>
      {/* Opaque, so the galaxy never shows through the footer. */}
      <div className="relative z-10 bg-background">
        <Footer />
      </div>
    </>
  );
}
