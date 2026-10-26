import { Footer } from './components/Footer.tsx'
import { Header } from './components/Header.tsx'
import { Hero } from './components/Hero.tsx'
import { HowItWorks } from './components/HowItWorks.tsx'
import { LanguageToggle } from './components/LanguageToggle.tsx'
import { LeadForms } from './components/LeadForms.tsx'
import { PhotographerProgram } from './components/PhotographerProgram.tsx'
import { Services } from './components/Services.tsx'
import { WhyChooseUs } from './components/WhyChooseUs.tsx'
import { useLanguage } from './i18n/LanguageContext.tsx'

export default function App() {
  const { t } = useLanguage()

  return (
    <div id="top">
      <LanguageToggle />
      <a href="#main" className="skip-link">
        {t.skip}
      </a>
      <p className="header-safe bg-ink py-2 text-center text-sm text-foam">
        {t.banner}
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
