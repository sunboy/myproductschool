import Image from 'next/image'

type CompanyTickerItem = {
  name: string
  src?: string
}

const logoCompanies: CompanyTickerItem[] = [
  { name: 'Meta', src: '/landing-v3/logos/meta.svg' },
  { name: 'Google', src: '/landing-v3/logos/google.svg' },
  { name: 'Stripe', src: '/landing-v3/logos/stripe.svg' },
  { name: 'Airbnb', src: '/landing-v3/logos/airbnb.svg' },
  { name: 'Uber', src: '/landing-v3/logos/uber.svg' },
  { name: 'DoorDash', src: '/landing-v3/logos/doordash.svg' },
]

const textCompanies: CompanyTickerItem[] = [
  { name: 'Amazon' },
  { name: 'Apple' },
  { name: 'Microsoft' },
  { name: 'Netflix' },
  { name: 'LinkedIn' },
  { name: 'TikTok' },
  { name: 'YouTube' },
  { name: 'Shopify' },
  { name: 'Salesforce' },
  { name: 'Adobe' },
  { name: 'Coinbase' },
  { name: 'Robinhood' },
  { name: 'Instacart' },
  { name: 'Lyft' },
  { name: 'Pinterest' },
  { name: 'Snap' },
  { name: 'Reddit' },
  { name: 'Discord' },
  { name: 'Figma' },
  { name: 'Notion' },
  { name: 'Linear' },
  { name: 'OpenAI' },
  { name: 'Anthropic' },
  { name: 'Datadog' },
  { name: 'Snowflake' },
  { name: 'Palantir' },
  { name: 'Dropbox' },
  { name: 'Atlassian' },
  { name: 'NVIDIA' },
  { name: 'Tesla' },
]

const tickerCompanies = [...logoCompanies, ...textCompanies]
const tickerLoops = [tickerCompanies, tickerCompanies]

const cards = [
  {
    title: 'Practicing alone',
    body: 'Solving in silence trains the wrong skill. The room makes you think out loud.',
    image: '/landing-v3/section-2/solo-grid.png',
    alt: 'Abstract scattered practice tiles for interview disciplines.',
    width: 1254,
    height: 1254,
  },
  {
    title: 'What you can’t see',
    body: 'You can practice for hours and still miss what interviewers actually score.',
    image: '/landing-v3/section-2/blind-spots.png',
    alt: 'Abstract tangled path with hidden evaluation gaps.',
    width: 1402,
    height: 1122,
  },
  {
    title: 'Honest feedback',
    body: 'Hatch reads your answer and shows you the exact gap to close.',
    image: '/landing-v3/section-2/calibrated-feedback.png',
    alt: 'Abstract organized feedback loop with rubric signals.',
    width: 1536,
    height: 1024,
    hasHatch: true,
  },
]

export function V3ContextSection() {
  return (
    <section className="context-section" aria-labelledby="context-heading">
      <div className="shell">
        <div className="context-logo-row" aria-label="Practice for interviews at">
          <div className="context-logo-label">Practice for interviews at</div>
          <div className="context-logo-marquee" tabIndex={0}>
            <div className="context-logo-track">
              {tickerLoops.map((companies, loopIndex) => (
                <div className="context-logo-group" aria-hidden={loopIndex > 0} key={loopIndex}>
                  {companies.map((company) => (
                    <div className="context-logo" key={`${loopIndex}-${company.name}`}>
                      {/* Letter-mark tiles are banned (spec §8): companies without a
                          real logo asset render as plain text. */}
                      {company.src ? (
                        <Image src={company.src} alt="" aria-hidden="true" width={24} height={24} />
                      ) : null}
                      <span>{company.name}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="context-copy">
          <h2 id="context-heading">
            Interview confidence is a skill you can build.
          </h2>
          <p>Practice under pressure with a coach that gives you clear feedback.</p>
        </div>

        <div className="context-map">
          <Image
            className="context-connector"
            src="/landing-v3/section-2/context-connector.png"
            alt=""
            aria-hidden="true"
            width={1920}
            height={819}
            sizes="100vw"
          />

          <div className="context-card-grid">
            {cards.map((card) => (
              <article className="context-card" key={card.title}>
                <div className="context-card-art">
                  <Image
                    src={card.image}
                    alt={card.alt}
                    width={card.width}
                    height={card.height}
                    sizes="(max-width: 700px) 68vw, (max-width: 1100px) 28vw, 320px"
                  />
                  {card.hasHatch ? (
                    <Image
                      className="context-hatch"
                      src="/landing-v3/section-2/hatch-coach-cutout.png"
                      alt="Hatch, the HackProduct coach."
                      width={1254}
                      height={1254}
                      sizes="96px"
                    />
                  ) : null}
                </div>
                <div className="context-card-copy">
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
