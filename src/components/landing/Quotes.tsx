import { RoleWordSearch, ToolsSystemPreview } from './LivePreviews'

export function Quotes() {
  return (
    <>
      <section className="land-tools">
        <div className="pixel-tree pixel-tree--tools-left" aria-hidden />
        <div className="pixel-tree pixel-tree--tools-right" aria-hidden />
        <div className="land-tools-inner">
          <div>
            <h2>All the tools and systems your prep needs</h2>
            <p>You stay in control. Hatch can plan, coach, grade, replay, and schedule the next rep, but nothing replaces your judgment.</p>
          </div>
          <ToolsSystemPreview />
        </div>
      </section>

      <section className="land-industries">
        <div className="land-section-head land-section-head--center">
          <h2>Build across roles and interview loops</h2>
          <p>From software products to marketplaces, data platforms, AI agents, and growth loops.</p>
        </div>
        <RoleWordSearch />
      </section>
    </>
  )
}
