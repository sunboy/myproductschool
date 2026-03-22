interface WhatWorkedSectionProps {
  whatWorked: string[]
  whatToFix: string[]
}

export function WhatWorkedSection({ whatWorked, whatToFix }: WhatWorkedSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
      <div className="bg-surface-container rounded-2xl p-5">
        <h3 className="font-label font-semibold text-on-surface mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>check_circle</span>
          What Worked
        </h3>
        <ul className="space-y-2">
          {whatWorked.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-on-surface">
              <span className="material-symbols-outlined text-primary text-base mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>check_circle</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-surface-container rounded-2xl p-5">
        <h3 className="font-label font-semibold text-on-surface mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-error text-lg" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>cancel</span>
          What to Fix
        </h3>
        <ul className="space-y-2">
          {whatToFix.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-on-surface">
              <span className="material-symbols-outlined text-error text-base mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>cancel</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
