'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SupportedLanguage } from '@/lib/coding/types'

interface LanguageOption {
  value: SupportedLanguage
  label: string
  icon?: string
}

const DEFAULT_LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'python', label: 'Python', icon: 'code' },
  { value: 'javascript', label: 'JavaScript', icon: 'javascript' },
  { value: 'java', label: 'Java', icon: 'code' },
  { value: 'cpp', label: 'C++', icon: 'code' },
  { value: 'go', label: 'Go', icon: 'code' },
  { value: 'sql', label: 'SQL', icon: 'table_chart' },
]

interface LanguageSelectorProps {
  value: SupportedLanguage
  onChange: (language: SupportedLanguage) => void
  options?: SupportedLanguage[]
  disabled?: boolean
}

export function LanguageSelector({
  value,
  onChange,
  options,
  disabled = false,
}: LanguageSelectorProps) {
  const availableOptions = options
    ? DEFAULT_LANGUAGE_OPTIONS.filter((opt) => options.includes(opt.value))
    : DEFAULT_LANGUAGE_OPTIONS

  return (
    <Select
      value={value}
      onValueChange={(val) => onChange(val as SupportedLanguage)}
      disabled={disabled}
    >
      <SelectTrigger
        className="h-7 w-auto min-w-0 gap-1 rounded-md border-transparent bg-transparent px-2 font-label text-xs font-semibold text-ink-secondary shadow-none hover:bg-page-field hover:text-ink-strong"
        aria-label="Select programming language"
      >
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent className="bg-card-bright border-hairline">
        {availableOptions.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className="text-ink-strong font-label text-sm hover:bg-page-field focus:bg-page-field cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-[16px] text-ink-secondary"
                aria-hidden="true"
              >
                {opt.icon ?? 'code'}
              </span>
              {opt.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
