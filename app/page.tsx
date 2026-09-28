import { Hero } from "@/components/hero/Hero";
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
      <main className="flex-1">
        <Hero />
        <ClientProof />
        <ParticleStory>
          <Services />
          <Staffing />
          <WhyUs />
          <Process />
        </ParticleStory>
        <About />
        <Testimonials />
        <ContactCta />
      </main>
      <Footer />
    </>
  );
}
