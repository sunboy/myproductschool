import { AuthForm } from '@/components/auth/AuthForm'

export const metadata = { title: 'Sign up | HackProduct' }

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; archetype?: string }>
}) {
  const { redirectTo, archetype } = await searchParams
  return <AuthForm mode="signup" redirectTo={redirectTo} archetype={archetype} />
}
