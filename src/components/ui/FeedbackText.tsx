'use client'

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Md, type MdTone, type MdVariant } from '@/components/ui/Md'
import { formatFeedbackMarkdown } from '@/lib/feedback-format'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface FeedbackTextProps {
  children?: string | null
  className?: string
  tone?: MdTone
  variant?: MdVariant
}

export function FeedbackText({
  children,
  className,
  tone = 'inherit',
  variant = 'feedback',
}: FeedbackTextProps) {
  const markdown = formatFeedbackMarkdown(children)
  if (!markdown) return null

  return (
    <div className={cn('text-sm leading-relaxed', className)}>
      <Md tone={tone} variant={variant}>{markdown}</Md>
    </div>
  )
}
