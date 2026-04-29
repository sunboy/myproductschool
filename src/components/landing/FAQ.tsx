const FAQ_ITEMS = [
  {
    q: 'Is this just for PMs, or for engineers too?',
    a: "Both, and that's the point. Engineers who understand product thinking, system design, and data at a deep level are the ones who stay relevant as AI takes over routine coding. HackProduct is for anyone who wants to think clearly and move fast.",
  },
  {
    q: 'Which discipline should I start with?',
    a: "Start with what's most relevant to your next interview or current role. Engineers often start with System Design or Coding; PMs usually start with Product Sense. You can run all five tracks in parallel. FLOW transfers across all of them.",
  },
  {
    q: 'What is FLOW?',
    a: "FLOW is the structured thinking framework behind every HackProduct challenge: Frame the problem, List your options and constraints, Optimize for what matters, Win with a clear recommendation. It's how the best engineers and PMs actually think, and it's learnable.",
  },
  {
    q: 'How much time per day?',
    a: '20 minutes. The Quick Take is 60 seconds; the full daily session is around 20 minutes. Most people do it on lunch or a coffee break.',
  },
  {
    q: "What makes Hatch different from just using ChatGPT?",
    a: "Hatch knows your last 50 reps, tracks your weak spots in the FLOW rubric, and pushes back when you hand-wave. It's not a general assistant. It's a coach with context and a specific point of view on what good looks like.",
  },
  {
    q: 'Can my company expense it?',
    a: "Yes. We have team plans and most companies reimburse it under L&D. Tap 'Team plan' on Pricing for an invoice template.",
  },
]

export function FAQ() {
  return (
    <section id="faq" className="land-section">
      <div className="land-section-inner">
        <div className="land-section-eyebrow">FAQ</div>
        <h2 className="land-section-h">Things <em>people ask us</em>.</h2>
        <div className="land-faq">
          {FAQ_ITEMS.map((item, i) => (
            <details key={i} className="land-faq-item" {...(i === 0 ? { open: true } : {})}>
              <summary className="land-faq-q">{item.q}</summary>
              <div className="land-faq-a">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
