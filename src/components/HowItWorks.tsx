import { Eyebrow, Reveal } from './Reveal.tsx'

const steps = [
  {
    number: '01',
    title: 'Get the Tripframe app.',
    body: 'Travelers find a photographer on iPhone or Android. The apps are still being built.',
  },
  {
    number: '02',
    title: 'Choose the shoot.',
    body: 'In the app, pick a destination and mobile, professional, drone, or hotel photography.',
  },
  {
    number: '03',
    title: 'Meet a local photographer.',
    body: 'When booking opens, the introduction happens in the app, not on this website.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-t border-line px-5 py-20 sm:px-8 sm:py-28">
      <Reveal className="mx-auto max-w-6xl">
        <Eyebrow>How it works</Eyebrow>
        <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <h2 className="max-w-xl text-4xl sm:text-5xl">Three steps. No scavenger hunt.</h2>
          <p className="max-w-sm text-muted">
            Travelers use the mobile apps. Photographers apply on this website while the apps are still being built.
          </p>
        </div>
        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step) => (
            <li key={step.number} className="border-t border-ink/15 pt-6">
              <p className="font-display text-3xl text-sea">{step.number}</p>
              <h3 className="mt-4 text-2xl">{step.title}</h3>
              <p className="mt-3 text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  )
}
