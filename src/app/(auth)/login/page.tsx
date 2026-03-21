import { AuthForm } from '@/components/auth/AuthForm'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <AuthForm mode="login" />
        <p className="text-center mt-4 text-sm text-on-surface-variant">
          <Link href="/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
        </p>
      </div>
    </div>
  )
}
