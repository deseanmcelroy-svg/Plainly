const STEPS = [
  {
    emoji: '📍',
    title: '1. Tell us where you live',
    body: "That's it — just a city, address, or ZIP. We figure out the rest.",
  },
  {
    emoji: '🗳️',
    title: '2. See your real ballot',
    body: "Every race and measure you'll actually vote on, all in one place.",
  },
  {
    emoji: '💬',
    title: '3. Get the plain-language version',
    body: 'What it does, who it affects, and what a yes or no means — no jargon.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-[1000px] px-[6vw] py-12">
      <div className="mb-9 text-center">
        <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.4rem)] font-bold tracking-tight">
          How this works
        </h2>
        <p className="mx-auto max-w-[480px] text-base text-muted">
          Three simple steps. No politics degree required.
        </p>
      </div>
      <div className="grid gap-6 text-center md:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.title} className="rounded-2xl bg-card px-6 py-8">
            <div className="mb-3 text-4xl">{step.emoji}</div>
            <h3 className="mb-2 font-display text-xl font-bold">{step.title}</h3>
            <p className="text-base text-muted">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
