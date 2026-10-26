import { Footer } from './components/Footer.tsx'
import { Header } from './components/Header.tsx'
import { Hero } from './components/Hero.tsx'
import { HowItWorks } from './components/HowItWorks.tsx'
import { LeadForms } from './components/LeadForms.tsx'
import { PhotographerProgram } from './components/PhotographerProgram.tsx'
import { Services } from './components/Services.tsx'
import { WhyChooseUs } from './components/WhyChooseUs.tsx'

export default function App() {
  return (
    <div id="top">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <p className="bg-ink px-5 py-2 text-center text-sm text-foam">
        Photographers can apply on this site. Travelers will find a photographer in the Tripframe apps, which are still being built.
      </p>
      <Header />
      <main id="main">
        <Hero />
        <HowItWorks />
        <Services />
        <WhyChooseUs />
        <PhotographerProgram />
        <LeadForms />
      </main>
      <Footer />
    </div>
  )
}
