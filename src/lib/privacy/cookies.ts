export const COOKIE_CHOICE_STORAGE_KEY = 'hackproduct_cookie_choice'
export const COOKIE_CHOICE_EVENT = 'hackproduct:cookie-choice'

export type CookieChoice = 'all' | 'essential'

export function isCookieChoice(value: string | null): value is CookieChoice {
  return value === 'all' || value === 'essential'
}
