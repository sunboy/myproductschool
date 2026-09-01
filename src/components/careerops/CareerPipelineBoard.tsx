'use client'
// Application pipeline — a status-column board over job_applications. v1 uses a
// status <select> per card (no drag) to keep it simple and accessible.

import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { APPLICATION_STATUSES, type ApplicationStatus } from '@/lib/careerops/types'
import { motionSprings } from '@/components/motion/tokens'
import { gradeClasses } from './grade'
import { useCareerApplications, type Application } from './useCareerApplications'

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offer: 'Offer',
  rejected: 'Rejected',
  archived: 'Archived',
}

const ACTIVE_STATUSES: ApplicationStatus[] = ['saved', 'applied', 'interviewing', 'offer']

interface CareerPipelineBoardProps {
  applications?: Application[]
  loading?: boolean
  changeStatus?: (id: string, status: ApplicationStatus) => Promise<void>
  remove?: (id: string) => Promise<void>
}

export function CareerPipelineBoard(props: CareerPipelineBoardProps) {
  // Fall back to self-fetch when not provided from hub
  const hook = useCareerApplications()
  const apps = props.applications ?? hook.applications
  const loading = props.loading ?? hook.loading
  const changeStatus = props.changeStatus ?? hook.changeStatus
  const remove = props.remove ?? hook.remove

  if (loading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-surface-container" aria-busy />
  }

  if (apps.length === 0) {
    return (
      <div className="rounded-2xl bg-surface-container p-6 text-center">
        <span className="material-symbols-outlined text-3xl text-on-surface-variant" aria-hidden>inbox</span>
        <p className="mt-2 font-body text-sm text-on-surface-variant">
          No applications yet. Save a job from the feed or score a JD to start your pipeline.
        </p>
      </div>
    )
  }

  return (
    <LayoutGroup id="careerops-pipeline">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ACTIVE_STATUSES.map((status) => {
          const column = apps.filter((a) => a.status === status)
          return (
            <div key={status} className="rounded-2xl bg-surface-container-low p-3">
              <div className="mb-2 flex items-center justify-between px-1">
                <h3 className="font-label text-sm font-semibold text-on-surface">{STATUS_LABEL[status]}</h3>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={column.length}
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    transition={motionSprings.pop}
                    className="font-label text-xs text-on-surface-variant"
                  >
                    {column.length}
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="space-y-2">
                <AnimatePresence>
                  {column.map((app) => (
                    <motion.div
                      key={app.id}
                      layout
                      layoutId={`app-${app.id}`}
                      transition={motionSprings.layout}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                      className="rounded-xl bg-surface p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 truncate font-body text-sm font-semibold text-on-surface">
                          {app.role_title ?? 'Untitled role'}
                        </p>
                        {app.fit_grade && (
                          <span className={`shrink-0 rounded-full px-2 py-0.5 font-label text-xs font-bold ${gradeClasses(app.fit_grade as never)}`}>
                            {app.fit_grade}
                          </span>
                        )}
                      </div>
                      {app.company && <p className="truncate font-body text-xs text-on-surface-variant">{app.company}</p>}
                      {app.next_action && (
                        <p className="mt-1 font-body text-xs text-tertiary">Next: {app.next_action}</p>
                      )}
                      <div className="mt-2 flex items-center gap-1.5">
                        <select
                          value={app.status}
                          onChange={(e) => changeStatus(app.id, e.target.value as ApplicationStatus)}
                          className="min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface-container px-2 py-1 font-label text-xs text-on-surface outline-none"
                        >
                          {APPLICATION_STATUSES.map((s) => (
                            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => remove(app.id)}
                          aria-label="Delete application"
                          className="grid h-7 w-7 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container-highest"
                        >
                          <span className="material-symbols-outlined text-[16px]" aria-hidden>delete</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {column.length === 0 && (
                  <p className="px-1 py-2 font-body text-xs text-on-surface-variant">Nothing here yet.</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </LayoutGroup>
  )
}
