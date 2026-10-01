import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Clients } from "./components/Clients";
import { Services } from "./components/Services";
import { Staffing } from "./components/Staffing";
import { WhyUs } from "./components/WhyUs";
import { Process } from "./components/Process";
import { About } from "./components/About";
import { Careers } from "./components/Careers";
import { Testimonials } from "./components/Testimonials";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";

// The light design's homepage. Same content and section order as the dark
// design (content/site.ts, plan section 04), built from its own components.
export default function LightHome() {
  return (
    <>
      <Header />
      <main id="top">
        <Hero />
        <Clients />
        <Services />
        <Staffing />
        <WhyUs />
        <Process />
        <About />
        <Careers />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
