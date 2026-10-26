import { Eyebrow, Reveal } from './Reveal.tsx'

const reasons = [
  {
    title: 'Convenience',
    body: 'One request instead of hotel desks, group chats, and hopeful DMs.',
  },
  {
    title: 'Flexibility',
    body: 'A spontaneous walk or a session you plan before you land.',
  },
  {
    title: 'Local expertise',
    body: 'Photographers who know the light, the streets, and where to stand.',
  },
  {
    title: 'Every budget',
    body: 'From a phone session to a drone flight and a fully edited portrait set.',
  },
]

export function WhyChooseUs() {
  return (
    <section id="why" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28">
      <Reveal className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <figure className="overflow-hidden rounded-[1.7rem]">
          <img
            src="/images/why.webp"
            width={1200}
            height={1500}
            alt="The bow of a wooden boat on a turquoise alpine lake"
            loading="lazy"
            decoding="async"
            className="aspect-[4/5] w-full object-cover object-center sm:aspect-[5/4] lg:aspect-[4/5]"
          />
        </figure>
        <div>
          <Eyebrow>Why choose us</Eyebrow>
          <h2 className="mt-4 text-4xl sm:text-5xl">Travel photography, without the runaround.</h2>
          <p className="mt-5 max-w-xl text-muted">
            Travelers will request a photographer in the Tripframe apps. Local photographers apply
            on this website for work that fits their city.
          </p>
          <ul className="mt-10 grid gap-8 sm:grid-cols-2">
            {reasons.map((reason) => (
              <li key={reason.title}>
                <h3 className="text-2xl">{reason.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{reason.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  )
}
