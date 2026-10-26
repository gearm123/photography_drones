import { serviceOptions } from '../lib/leadRules.ts'
import { appsAreLive, commissionPercent, launchLocations, photographerPercent, supportEmail } from '../content/photographerOffer.ts'
import { AppDownloads } from './AppDownloads.tsx'
import { Eyebrow, Reveal } from './Reveal.tsx'

const reasons = [
  {
    title: 'Travelers request you',
    body: 'People looking for a photographer use the Tripframe apps. You are not chasing hotel desks, group chats, or hopeful messages.',
  },
  {
    title: 'You set the hourly rate',
    body: 'The rate on your application is the price the traveler pays. Tripframe does not invent a second rate after you are approved.',
  },
  {
    title: 'You work your own cities',
    body: 'The first photographers are in Lisbon, Cascais, and Sintra. You list the areas you already know.',
  },
  {
    title: 'Your portfolio does the introduction',
    body: 'The samples you submit are what an approved profile shows. Your email, WhatsApp number, and private notes stay off that profile.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Apply on this page',
    body: 'Send your WhatsApp number, equipment, experience, availability, working areas, hourly rate, specialties, and at least one portfolio link.',
  },
  {
    number: '02',
    title: 'Wait for the review email',
    body: 'We email a confirmation when the application is saved as pending, then another message when it is approved or not.',
  },
  {
    number: '03',
    title: 'Your public profile is prepared',
    body: 'Approval publishes your name, location, working areas, specialties, rate, and portfolio. Contact details and vetting notes stay private.',
  },
  {
    number: '04',
    title: appsAreLive ? 'Download the app' : 'Get the app when it launches',
    body: appsAreLive
      ? 'Download Tripframe for iPhone or Android. Travelers request photographers there.'
      : 'Travelers will request photographers in the iPhone and Android apps. The store buttons do not open a download until those apps are available.',
  },
]

const questions = [
  {
    question: 'Why should I join?',
    answer:
      'Travelers will look for a local photographer in the Tripframe apps instead of asking around after they land. You choose your cities, your specialties, and your hourly rate, and you apply once on this website.',
  },
  {
    question: 'What does it cost to apply?',
    answer: 'Nothing. There is no application fee and no subscription. This website does not ask for a payment card.',
  },
  {
    question: 'How does commission work?',
    answer: `Tripframe keeps ${commissionPercent}% of the session the traveler pays. You receive ${photographerPercent}%. A two-hour session at €75 is €150. Tripframe keeps €30 and you receive €120. The rate you propose is the traveler's price, not a rate with commission added on top.`,
  },
  {
    question: 'When am I paid?',
    answer:
      'After a completed booking in the app. Booking and payouts are not live yet, so submitting an application does not create a payment. You will not be paid for applying.',
  },
  {
    question: 'Where is the first launch?',
    answer: `The first photographer network is ${launchLocations.join(', ')}. The shoots we list are mobile photography, professional photography, drone photography, and hotels and resorts.`,
  },
  {
    question: 'Can a traveler book me on this website?',
    answer:
      'No. Travelers find and request a photographer in the iPhone and Android apps. This page is only the photographer application.',
  },
  {
    question: 'Who do I contact?',
    answer: `Email ${supportEmail} from the address on your application and include your name. We can help with the application, an approval, or a question about pay. There is no phone support line.`,
  },
]

export function PhotographerProgram() {
  return (
    <section id="why-join" className="scroll-mt-24 border-t border-line px-5 py-20 sm:px-8 sm:py-28">
      <Reveal className="mx-auto max-w-6xl">
        <Eyebrow>For photographers</Eyebrow>
        <h2 className="mt-4 max-w-3xl text-4xl sm:text-5xl">Why photographers join Tripframe.</h2>
        <p className="mt-5 max-w-2xl text-muted">
          Apply if you already photograph in our launch cities. Travelers will request you in the app.
          You are not asked to bring your own clients.
        </p>
        <ul className="mt-12 grid gap-8 sm:grid-cols-2">
          {reasons.map((reason) => (
            <li key={reason.title} className="rounded-[1.4rem] border border-line bg-foam p-6">
              <h3 className="text-2xl">{reason.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{reason.body}</p>
            </li>
          ))}
        </ul>

        <div id="pay" className="mt-20 scroll-mt-28">
          <Eyebrow>Pay</Eyebrow>
          <h2 className="mt-4 max-w-3xl text-4xl sm:text-5xl">
            You keep {photographerPercent}%. Tripframe keeps {commissionPercent}%.
          </h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4 text-muted">
              <p>
                The hourly rate on your application is what the traveler pays. Tripframe’s commission
                is {commissionPercent}% of that booked session. You receive the other {photographerPercent}% after
                the session is complete.
              </p>
              <p>
                Commission is taken from the traveler’s price. It is not added on top of your rate.
                There is no fee to apply and no monthly charge. This website does not take payment
                and does not pay photographers. Payouts start only when booking opens in the app.
              </p>
            </div>
            <aside className="rounded-[1.4rem] bg-ink p-6 text-foam">
              <p className="text-xs font-medium tracking-[0.16em] text-foam/60 uppercase">Example</p>
              <p className="mt-4 font-display text-3xl">€150 session</p>
              <p className="mt-3 text-sm text-foam/80">Two hours at your €75 rate.</p>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt>Tripframe, {commissionPercent}%</dt>
                  <dd>€30</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-white/15 pt-3 text-base">
                  <dt>You receive, {photographerPercent}%</dt>
                  <dd>€120</dd>
                </div>
              </dl>
            </aside>
          </div>
        </div>

        <div id="launch" className="mt-20 scroll-mt-28">
          <Eyebrow>Launch</Eyebrow>
          <h2 className="mt-4 max-w-3xl text-4xl sm:text-5xl">First cities, and the specialties we list.</h2>
          <p className="mt-5 max-w-2xl text-muted">
            Apply if you can work in at least one of these places. Choose every specialty you are ready to shoot.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-2xl">Initial locations</h3>
              <ul className="mt-4 space-y-3">
                {launchLocations.map((city) => (
                  <li key={city} className="rounded-2xl border border-line bg-foam px-4 py-3">
                    {city}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-2xl">Specialties</h3>
              <ul className="mt-4 space-y-3">
                {serviceOptions.map((service) => (
                  <li key={service.value} className="rounded-2xl border border-line bg-foam px-4 py-3">
                    {service.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div id="onboarding" className="mt-20 scroll-mt-28">
          <Eyebrow>Onboarding</Eyebrow>
          <h2 className="mt-4 max-w-3xl text-4xl sm:text-5xl">From application to first request.</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-2">
            {steps.map((step) => (
              <li key={step.number} className="border-t border-ink/15 pt-5">
                <p className="font-display text-3xl text-sea">{step.number}</p>
                <h3 className="mt-3 text-2xl">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>

        <div id="faq" className="mt-20 scroll-mt-28">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="mt-4 text-4xl sm:text-5xl">Photographer questions.</h2>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {questions.map((item) => (
              <details key={item.question} className="group py-4">
                <summary className="cursor-pointer text-lg font-medium">{item.question}</summary>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>

        <div id="support" className="mt-20 scroll-mt-28">
          <Eyebrow>Support</Eyebrow>
          <h2 className="mt-4 max-w-3xl text-4xl sm:text-5xl">Contact us, and get the app when it launches.</h2>
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div>
              <p className="text-muted">
                Email us about an application, an approval, or how pay will work. Write from the email
                address on your application and include your name.
              </p>
              <a
                href={`mailto:${supportEmail}?subject=Photographer%20support`}
                className="mt-6 inline-flex min-h-12 items-center rounded-full bg-ink px-6 text-base font-medium text-foam hover:bg-sea"
              >
                {supportEmail}
              </a>
              <p className="mt-4 text-sm text-muted">There is no phone support line.</p>
            </div>
            <div>
              <h3 className="text-2xl">iPhone and Android</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {appsLiveCopy()}
              </p>
              <div className="mt-5">
                <AppDownloads />
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

function appsLiveCopy(): string {
  if (appsAreLive) {
    return 'Download Tripframe for iPhone or Android. Travelers request photographers in the app, and approved photographers use it when booking opens.'
  }
  return 'The apps are still being built. These buttons stay on this page and do not open a store. When the apps launch, the same buttons open the App Store and Google Play.'
}
