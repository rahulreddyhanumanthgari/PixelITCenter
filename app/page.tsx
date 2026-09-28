import { Hero } from "@/components/hero/Hero";
import { JourneyLayer } from "@/components/journey/JourneyLayer";
import { ParticleStory } from "@/components/story/ParticleStory";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ClientProof } from "@/components/sections/ClientProof";
import { Services } from "@/components/sections/Services";
import { Staffing } from "@/components/sections/Staffing";
import { WhyUs } from "@/components/sections/WhyUs";
import { Process } from "@/components/sections/Process";
import { About } from "@/components/sections/About";
import { Testimonials } from "@/components/sections/Testimonials";
import { ContactCta } from "@/components/sections/ContactCta";

// Homepage flow from the modernization plan (section 04).
export default function HomePage() {
  return (
    <>
      <Header />
      {/* One particle system for the whole journey, fixed behind the page. */}
      <JourneyLayer />
      {/* Content sits above the particle layer (z-10). The hero, client strip
          and story are transparent so the particles show through; everything
          after the story is opaque and slides over them like a curtain. */}
      <main className="relative z-10 flex-1">
        <Hero />
        <ClientProof />
        <ParticleStory>
          <Services />
          <Staffing />
          <WhyUs />
          <Process />
        </ParticleStory>
        <div className="relative bg-background">
          <About />
          <Testimonials />
          <ContactCta />
        </div>
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </>
  );
}
