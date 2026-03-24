const companies = ['Meta', 'Google', 'Stripe', 'Airbnb', 'Uber', 'DoorDash']

export function LogoMarquee() {
  return (
    <section className="py-12 bg-background relative overflow-hidden">
      <div className="marquee-container">
        <div className="flex whitespace-nowrap animate-scroll gap-20 items-center">
          {/* Set 1 */}
          {companies.map((name) => (
            <span
              key={`a-${name}`}
              className="text-2xl font-bold text-outline/50 font-headline italic tracking-tighter"
            >
              {name}
            </span>
          ))}
          {/* Set 2 (duplicate for seamless loop) */}
          {companies.map((name) => (
            <span
              key={`b-${name}`}
              className="text-2xl font-bold text-outline/50 font-headline italic tracking-tighter"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
