import { CurriculumStack } from './LivePreviews'

export function DisciplinesSection() {
  return (
    <section id="start" className="land-guide">
      <div className="land-section-head land-section-head--center">
        <h2>Learn how to pass a product interview</h2>
        <p>Read the field guide, then run the chapter as live practice with Hatch.</p>
      </div>
      <CurriculumStack />
    </section>
  )
}
