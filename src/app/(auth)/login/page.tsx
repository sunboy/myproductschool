import { ActiveLoginConcept } from '@/components/auth/editorial/ActiveLoginConcept'
import { authRedirectFromParams } from '@/lib/auth/redirect'

export const metadata = { title: 'Log in | HackProduct' }

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return <ActiveLoginConcept mode="login" redirectTo={authRedirectFromParams(await searchParams)} />
}
