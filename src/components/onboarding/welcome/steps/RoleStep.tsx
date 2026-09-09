'use client'
import { ROLES } from '@/components/onboarding/QuickRoleSelect'

export function RoleStep({ role, alsoRoles, onRole, onToggleAlso }: { role: string | null; alsoRoles: string[]; onRole: (r: string) => void; onToggleAlso: (r: string) => void }) {
  const chip = (active: boolean) => `rounded-full border px-4 py-2.5 text-body font-semibold ${active ? 'border-forest-800 bg-forest-800 text-white' : 'border-hairline bg-card-bright text-ink-strong hover:bg-surface-container'}`
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-2.5 text-ui font-bold"><span className="text-error">*</span> Primary role</div>
        <div className="flex flex-wrap gap-2">
          {ROLES.map(r => (
            <button key={r.id} type="button" data-testid={`role-${r.id}`} aria-pressed={role === r.id} onClick={() => onRole(r.id)} className={chip(role === r.id)}>{r.label}</button>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2.5 text-ui font-bold">Also preparing for <span className="font-normal text-ink-secondary">(optional, up to two)</span></div>
        <div className="flex flex-wrap gap-2">
          {ROLES.filter(r => r.id !== role).map(r => (
            <button key={r.id} type="button" data-testid={`also-${r.id}`} aria-pressed={alsoRoles.includes(r.id)} onClick={() => onToggleAlso(r.id)} className={chip(alsoRoles.includes(r.id))}>{r.label}{alsoRoles.includes(r.id) ? ' ✕' : ''}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
