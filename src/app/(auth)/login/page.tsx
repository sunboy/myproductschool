import { AuthForm } from '@/components/auth/AuthForm'
import { authRedirectFromParams } from '@/lib/auth/redirect'

export const metadata = { title: 'Log in | HackProduct' }

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return <AuthForm mode="login" redirectTo={authRedirectFromParams(await searchParams)} />
}
