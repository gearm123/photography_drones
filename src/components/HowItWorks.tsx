import { Eyebrow, Reveal } from './Reveal.tsx'

const steps = [
  {
    number: '01',
    title: 'Choose your destination.',
    body: 'Tell us the city you are visiting, even if the trip is still a maybe.',
  },
  {
    number: '02',
    title: 'Select your photography service.',
    body: 'Mobile, professional, drone, or a session arranged with your hotel.',
  },
  {
    number: '03',
    title: 'Connect with a local photographer.',
    body: 'When Tripframe opens there, we introduce you to a photographer who knows the place.',
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
            This is the path from a destination to a local photographer. Early access is open while cities come online.
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
