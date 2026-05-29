'use client'

import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useMotionValue,
  useReducedMotion,
  type HTMLMotionProps,
} from 'framer-motion'
import type { CSSProperties, ReactNode, RefObject, UIEventHandler } from 'react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { motionSprings, motionVariants } from './tokens'

type DivMotionProps = HTMLMotionProps<'div'>

export function useMotionPreference() {
  return { prefersReducedMotion: Boolean(useReducedMotion()) }
}

export function usePanelVisibility<T extends string>(
  initial: Record<T, boolean>,
) {
  const [visibility, setVisibility] = useState(initial)

  return useMemo(() => ({
    visibility,
    setVisibility,
    show: (key: T) => setVisibility((current) => ({ ...current, [key]: true })),
    hide: (key: T) => setVisibility((current) => ({ ...current, [key]: false })),
    toggle: (key: T) => setVisibility((current) => ({ ...current, [key]: !current[key] })),
  }), [visibility])
}

export function useScrollCollapse(
  containerRef: RefObject<HTMLElement | null>,
  options?: {
    threshold?: number
    revealOffset?: number
    resetKey?: unknown
  },
) {
  const threshold = options?.threshold ?? 96
  const revealOffset = options?.revealOffset ?? 8
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [direction, setDirection] = useState<'up' | 'down'>('down')
  const previousScrollRef = useRef(0)
  const scrollY = useMotionValue(0)
  const scrollYProgress = useMotionValue(0)

  const handleScrollValue = useCallback((current: number, maxScroll: number) => {
    const previous = previousScrollRef.current
    const delta = current - previous
    if (Math.abs(delta) < 2) return

    const nextDirection = delta > 0 ? 'down' : 'up'
    const upwardDistance = Math.abs(delta)
    const isNearBottom = maxScroll - current <= revealOffset

    previousScrollRef.current = current
    setDirection(nextDirection)

    if (current <= revealOffset) {
      setIsCollapsed(false)
      return
    }

    if (nextDirection === 'down' && current > threshold) {
      setIsCollapsed(true)
      return
    }

    if (nextDirection === 'up' && !isNearBottom && upwardDistance >= revealOffset) {
      setIsCollapsed(false)
    }
  }, [revealOffset, threshold])

  const handleContainerScroll = useCallback((container: HTMLElement) => {
    const current = container.scrollTop
    const maxScroll = Math.max(1, container.scrollHeight - container.clientHeight)
    scrollY.set(current)
    scrollYProgress.set(Math.max(0, Math.min(1, current / maxScroll)))
    handleScrollValue(current, maxScroll)
  }, [handleScrollValue, scrollY, scrollYProgress])

  useEffect(() => {
    setIsCollapsed(false)
    setDirection('down')
    previousScrollRef.current = 0
  }, [containerRef, options?.resetKey])

  useEffect(() => {
    let cleanup: (() => void) | undefined
    let frame = 0

    const attach = () => {
      const container = containerRef.current
      if (!container) {
        frame = requestAnimationFrame(attach)
        return
      }

      const handleScroll = () => handleContainerScroll(container)

      container.addEventListener('scroll', handleScroll, { passive: true })
      handleScroll()
      cleanup = () => {
        container.removeEventListener('scroll', handleScroll)
      }
    }

    attach()

    return () => {
      cleanup?.()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [containerRef, handleContainerScroll, options?.resetKey])

  const onScroll = useCallback<UIEventHandler<HTMLElement>>((event) => {
    const target = event.currentTarget || event.target
    handleContainerScroll(target)
  }, [handleContainerScroll])

  return { isCollapsed, direction, onScroll, scrollY, scrollYProgress }
}

export function MotionPage({ className, children, ...props }: DivMotionProps) {
  return (
    <motion.div
      variants={motionVariants.page}
      initial="hidden"
      animate="show"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function MotionSection({ className, children, ...props }: DivMotionProps) {
  return (
    <motion.section
      variants={motionVariants.section}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.18 }}
      className={className}
      {...props}
    >
      {children}
    </motion.section>
  )
}

export function MotionCard({ className, children, ...props }: DivMotionProps) {
  return (
    <motion.div
      layout
      variants={motionVariants.card}
      initial="hidden"
      animate="show"
      exit="exit"
      transition={motionSprings.layout}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function MotionList({
  layoutKey,
  className,
  children,
  ...props
}: DivMotionProps & { layoutKey?: string }) {
  const fallbackId = useId()
  return (
    <LayoutGroup id={layoutKey ?? fallbackId}>
      <motion.div
        layout
        variants={motionVariants.list}
        initial="hidden"
        animate="show"
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    </LayoutGroup>
  )
}

export function MotionListItem({
  className,
  children,
  animate,
  transition,
  ...props
}: DivMotionProps) {
  return (
    <motion.div
      layout
      variants={motionVariants.listItem}
      initial="hidden"
      animate={animate ?? 'show'}
      exit="exit"
      transition={transition ?? motionSprings.layout}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function PresencePanel({
  isOpen,
  className,
  children,
  mode = 'popLayout',
  ...props
}: DivMotionProps & {
  isOpen: boolean
  mode?: 'sync' | 'popLayout' | 'wait'
}) {
  return (
    <AnimatePresence mode={mode} initial={false}>
      {isOpen && (
        <motion.div
          variants={motionVariants.panel}
          initial="hidden"
          animate="show"
          exit="exit"
          className={className}
          {...props}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function AnimatedProgress({
  value,
  label,
  state = 'idle',
  className,
  trackClassName,
  barClassName,
  barStyle,
  showValue = false,
}: {
  value: number
  label?: string
  state?: 'idle' | 'active' | 'complete' | 'next'
  className?: string
  trackClassName?: string
  barClassName?: string
  barStyle?: CSSProperties
  showValue?: boolean
}) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
  const prefersReducedMotion = useReducedMotion()
  const isPulsing = !prefersReducedMotion && (state === 'active' || state === 'next')

  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between gap-3 font-label text-xs font-bold">
          {label && <span>{label}</span>}
          {showValue && <span className="tabular-nums">{Math.round(clamped)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped)}
        className={cn(
          'relative h-1.5 w-full overflow-hidden rounded-full bg-black/10',
          trackClassName,
        )}
      >
        {isPulsing && (
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-white/20"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <motion.div
          className={cn(
            'h-full w-full origin-left rounded-full bg-primary',
            state === 'complete' && 'bg-primary',
            state === 'next' && 'bg-tertiary',
            barClassName,
          )}
          style={barStyle}
          initial={false}
          animate={{
            scaleX: clamped / 100,
            opacity: state === 'idle' && clamped === 0 ? 0.55 : 1,
          }}
          transition={prefersReducedMotion ? { duration: 0 } : motionSprings.layout}
        />
      </div>
    </div>
  )
}

export function CollapsiblePanel({
  open,
  defaultOpen = true,
  onOpenChange,
  title,
  icon,
  actions,
  children,
  className,
  headerClassName,
  bodyClassName,
  collapsedLabel = 'Open panel',
}: {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  title: ReactNode
  icon?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  headerClassName?: string
  bodyClassName?: string
  collapsedLabel?: string
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isOpen = open ?? internalOpen
  const setOpen = (nextOpen: boolean) => {
    if (open == null) setInternalOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  return (
    <motion.aside layout transition={motionSprings.panel} className={cn('flex flex-col overflow-hidden', className)}>
      <div className={cn('flex shrink-0 items-center justify-between gap-3', headerClassName)}>
        <div className="flex min-w-0 items-center gap-2">
          {icon && <span className="material-symbols-outlined text-[17px] leading-none">{icon}</span>}
          <span className="min-w-0 truncate">{title}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {actions}
          <button
            type="button"
            onClick={() => setOpen(!isOpen)}
            className="flex h-7 w-7 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label={isOpen ? 'Collapse panel' : collapsedLabel}
            aria-expanded={isOpen}
          >
            <motion.span
              className="material-symbols-outlined text-[17px] leading-none"
              animate={{ rotate: isOpen ? 0 : 180 }}
              transition={motionSprings.soft}
            >
              expand_less
            </motion.span>
          </button>
        </div>
      </div>
      <PresencePanel isOpen={isOpen} className={cn('min-h-0 flex-1 overflow-hidden', bodyClassName)}>
        {children}
      </PresencePanel>
    </motion.aside>
  )
}

export interface FocusSurfaceEvent {
  id: string
  kind: 'challenge' | 'topic' | 'rubric' | 'flow-signal' | 'memory'
  title: string
  body: string
  confidence?: number
  sourceTurnId?: string
}

const focusIcon: Record<FocusSurfaceEvent['kind'], string> = {
  challenge: 'flag',
  topic: 'topic',
  rubric: 'rule',
  'flow-signal': 'psychology',
  memory: 'bookmark',
}

export function FocusSurface({
  event,
  collapsed = false,
  onCollapsedChange,
  onDismiss,
  className,
  tone = 'light',
}: {
  event: FocusSurfaceEvent | null
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  onDismiss?: () => void
  className?: string
  tone?: 'light' | 'dark'
}) {
  if (!event) return null

  const dark = tone === 'dark'

  return (
    <MotionCard
      layoutId={`focus-surface-${event.id}`}
      className={cn(
        'overflow-hidden rounded-2xl border shadow-[0_18px_50px_-30px_rgba(20,32,24,0.55)]',
        dark
          ? 'border-white/10 bg-[#111c16]/90 text-[#f3ede0] backdrop-blur-xl'
          : 'border-outline-variant/55 bg-surface text-on-surface',
        className,
      )}
    >
      <div className={cn('flex items-start gap-3 p-3.5', collapsed ? 'items-center' : 'items-start')}>
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            dark ? 'bg-white/10 text-[#7ee099]' : 'bg-primary-fixed text-primary',
          )}
        >
          <span className="material-symbols-outlined text-[19px]">{focusIcon[event.kind]}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p
                className={cn(
                  'font-label text-[10px] font-extrabold uppercase tracking-widest',
                  dark ? 'text-white/35' : 'text-on-surface-variant',
                )}
              >
                Focus
              </p>
              <h3 className="truncate font-headline text-sm font-bold leading-snug">
                {event.title}
              </h3>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => onCollapsedChange?.(!collapsed)}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/45',
                  dark ? 'hover:bg-white/10' : 'hover:bg-surface-container',
                )}
                aria-label={collapsed ? 'Show focus detail' : 'Collapse focus detail'}
                aria-expanded={!collapsed}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {collapsed ? 'unfold_more' : 'unfold_less'}
                </span>
              </button>
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/45',
                    dark ? 'hover:bg-white/10' : 'hover:bg-surface-container',
                  )}
                  aria-label="Hide focus"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>
          <PresencePanel isOpen={!collapsed} className="pt-2">
            <p
              className={cn(
                'font-body text-sm leading-relaxed',
                dark ? 'text-white/70' : 'text-on-surface-variant',
              )}
            >
              {event.body}
            </p>
          </PresencePanel>
        </div>
      </div>
    </MotionCard>
  )
}

export { AnimatePresence, LayoutGroup, motion }
