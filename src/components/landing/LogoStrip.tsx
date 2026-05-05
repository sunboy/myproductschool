import { OrchestrationMap } from './LivePreviews'

export function LogoStrip() {
  return (
    <section id="how" className="land-orchestration">
      <div className="land-section-head land-section-head--center">
        <h2>
          HackProduct is an AI interview orchestration platform
          <span> designed to help you pass the full product loop</span>
        </h2>
      </div>
      <OrchestrationMap />
      <div className="land-pillars">
        <p><b>Specialized coaches</b> - product, systems, SQL, data, coding, and PM loops each get their own rubric.</p>
        <p><b>Human judgment first</b> - Hatch pushes you to frame, trade off, and defend decisions before it gives hints.</p>
        <p><b>Fully extensible prep</b> - connect goals, target companies, weak moves, saved notes, and live interviews.</p>
      </div>
    </section>
  )
}
