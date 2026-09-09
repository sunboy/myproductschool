// Round-4 (B11) how-it-works band per Codex ref 1: three numbered steps in one
// hairline container. Numbered forest markers only; no tinted icon squares
// (spec revision §2), no emoji, no em dashes.

type Step = {
  number: string
  title: string
  body: string
}

const steps: Step[] = [
  {
    number: '1',
    title: 'Choose your goal',
    body: 'Pick a track or skill to focus on, from system design to product sense.',
  },
  {
    number: '2',
    title: 'Practice and get feedback',
    body: 'Solve real problems, run live interviews, and get Hatch feedback on every answer.',
  },
  {
    number: '3',
    title: 'Track and improve',
    body: 'See your progress over time, find the weak move, and close the gap faster.',
  },
]

export function V3HowItWorks() {
  return (
    <section className="hiw-section" id="how-it-works" aria-labelledby="hiw-heading">
      <div className="shell">
        <h2 className="hiw-heading" id="hiw-heading">
          How it works
        </h2>
        <ol className="hiw-grid">
          {steps.map((step) => (
            <li className="hiw-step" key={step.number}>
              <span className="hiw-step-number" aria-hidden="true">
                {step.number}
              </span>
              <div className="hiw-step-copy">
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
