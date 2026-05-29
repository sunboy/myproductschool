import Link from 'next/link'

export function FomoBlock() {
  return (
    <section className="mkt-final-cta">
      <div className="mkt-final-inner">
        <div>
          <p>Start with one rep</p>
          <h2>Train for the next career moment before it is on the calendar.</h2>
        </div>
        <div className="mkt-final-actions">
          <Link href="/login?returnTo=/challenges" prefetch={false} className="mkt-button mkt-button-primary">
            Start a free rep
          </Link>
          <Link href="/practice" className="mkt-button mkt-button-secondary">
            Browse practice
          </Link>
        </div>
      </div>
    </section>
  )
}
