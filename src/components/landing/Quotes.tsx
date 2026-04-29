const QUOTES = [
  { t: "I went from 'I'd run an A/B test' to actually framing problems. Two weeks of Hatch reps did what 6 months of reading didn't.", n: 'Priya V.', r: 'Senior PM, Stripe', i: 'P' },
  { t: "The system design track is exactly what I needed before my staff eng loop. Hatch pushed back every time I hand-waved a trade-off.", n: 'Marcus T.', r: 'Staff Engineer, Vercel', i: 'M' },
  { t: "As an eng moving into product, the product sense challenges gave me the vocabulary and structure I was missing. It clicked fast.", n: 'Anika R.', r: 'Engineering Lead → PM, Anthropic', i: 'A' },
  { t: "The data modeling module is underrated. It's not just schema. It makes you think about access patterns and why. Really sharp.", n: 'Jordan K.', r: 'Data Engineer, Notion', i: 'J' },
]

export function Quotes() {
  return (
    <section id="proof" className="land-section land-section--alt">
      <div className="land-section-inner">
        <div className="land-section-eyebrow">People love it</div>
        <h2 className="land-section-h">Already thinking <em>more clearly</em>.</h2>
        <div className="land-quotes">
          {QUOTES.map((q, i) => (
            <div key={i} className="land-quote">
              <div className="land-quote-text">&ldquo;{q.t}&rdquo;</div>
              <div className="land-quote-attr">
                <div className="land-quote-avatar">{q.i}</div>
                <div>
                  <div className="land-quote-name">{q.n}</div>
                  <div className="land-quote-role">{q.r}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
