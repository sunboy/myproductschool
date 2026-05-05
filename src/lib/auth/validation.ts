import { z } from 'zod'

export const authEmailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required.')
  .max(254, 'Email is too long.')
  .email('Enter a valid email.')
  .transform(value => value.toLowerCase())

export const loginSchema = z.object({
  email: authEmailSchema,
  password: z.string().min(1, 'Password is required.'),
})

export const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(80, 'Name is too long.'),
  email: authEmailSchema,
  password: z
    .string()
    .min(10, 'Use at least 10 characters.')
    .refine(value => /[\d\W_]/.test(value), 'Add at least one number or symbol.'),
})

export const passwordResetRequestSchema = z.object({
  email: authEmailSchema,
})

export const turnstileTokenSchema = z
  .string()
  .trim()
  .max(2048, 'Refresh the security check and try again.')
  .optional()
  .default('')

export const honeypotSchema = z
  .string()
  .max(500)
  .optional()
  .default('')

export const protectedSignupSchema = signupSchema.extend({
  turnstileToken: turnstileTokenSchema,
  website: honeypotSchema,
})

export const protectedPasswordResetRequestSchema = passwordResetRequestSchema.extend({
  turnstileToken: turnstileTokenSchema,
})

export const resendVerificationSchema = z.object({
  email: authEmailSchema,
})

export const newPasswordSchema = z.object({
  password: z
    .string()
    .min(10, 'Use at least 10 characters.')
    .refine(value => /[\d\W_]/.test(value), 'Add at least one number or symbol.'),
  confirm: z.string().min(1, 'Confirm your password.'),
}).refine(value => value.password === value.confirm, {
  path: ['confirm'],
  message: 'Passwords do not match.',
})

export function firstZodError(error: z.ZodError) {
  return error.issues[0]?.message ?? 'Check the highlighted fields.'
}

export function zodFieldErrors<T extends string>(error: z.ZodError): Partial<Record<T, string>> {
  const errors: Partial<Record<T, string>> = {}
  for (const issue of error.issues) {
    const field = issue.path[0]
    if (typeof field === 'string' && !errors[field as T]) {
      errors[field as T] = issue.message
    }
  }
  return errors
}
