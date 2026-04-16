import { useEffect, useState } from 'react'

export function useInterviewTimer(
  startedAt: number | null,
  isActive: boolean,
  maxMinutes?: number
) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!startedAt || !isActive) return

    setElapsed(Math.floor((Date.now() - startedAt) / 1000))

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [startedAt, isActive])

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  const isWarning = elapsed >= 25 * 60
  const isLimitReached = maxMinutes != null && elapsed >= maxMinutes * 60

  return { elapsed, formatted, isWarning, isLimitReached }
}
