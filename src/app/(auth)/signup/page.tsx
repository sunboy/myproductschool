import { authRedirectFromParams } from '@/lib/auth/redirect'
import { AuthForm } from '@/components/auth/AuthForm'

export const metadata = { title: 'Sign up | HackProduct' }

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const archetype = typeof params.archetype === 'string' ? params.archetype : undefined
  const redirectTo = authRedirectFromParams(params)
  return <AuthForm mode="signup" redirectTo={redirectTo} archetype={archetype} />
}
