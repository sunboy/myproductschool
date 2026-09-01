'use client'

import { useCallback, useEffect, useState } from 'react'
import { type ApplicationStatus } from '@/lib/careerops/types'

export interface Application {
  id: string
  company: string | null
  role_title: string | null
  status: ApplicationStatus
  fit_score: number | null
  fit_grade: string | null
  next_action: string | null
  jd_url: string | null
}

export interface UseCareerApplicationsResult {
  applications: Application[]
  loading: boolean
  changeStatus: (id: string, status: ApplicationStatus) => Promise<void>
  remove: (id: string) => Promise<void>
  reload: () => Promise<void>
}

export function useCareerApplications(): UseCareerApplicationsResult {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/career-ops/applications')
      if (res.ok) {
        const data = await res.json()
        setApplications(data.applications ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  const changeStatus = useCallback(async (id: string, status: ApplicationStatus) => {
    setApplications((cur) => cur.map((a) => (a.id === id ? { ...a, status } : a)))
    await fetch(`/api/career-ops/applications/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }, [])

  const remove = useCallback(async (id: string) => {
    setApplications((cur) => cur.filter((a) => a.id !== id))
    await fetch(`/api/career-ops/applications/${id}`, { method: 'DELETE' })
  }, [])

  return { applications, loading, changeStatus, remove, reload }
}
