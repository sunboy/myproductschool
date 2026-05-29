import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError } from '@/lib/api/error'
import { hasValidReauthToken, REAUTH_COOKIE_NAME } from '@/lib/auth/reauth'
import { sendAccountDeletedEmail } from '@/lib/email/transactional'
import { createStripeClient } from '@/lib/stripe/config'
import { z, ZodError } from 'zod'

const RequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  confirmation: z.literal('DELETE'),
})

const CANCELABLE_SUBSCRIPTION_STATUSES = new Set(['active', 'past_due', 'trialing', 'unpaid'])

interface SubscriptionDeletionRow {
  stripe_subscription_id: string | null
  status: string | null
}

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

function isStripeResourceMissing(error: unknown) {
  if (!error || typeof error !== 'object' || !('code' in error)) return false
  return error.code === 'resource_missing'
}

async function cancelStripeSubscriptionIfNeeded(subscription: SubscriptionDeletionRow | null) {
  const subscriptionId = subscription?.stripe_subscription_id
  if (!subscriptionId || !CANCELABLE_SUBSCRIPTION_STATUSES.has(subscription.status ?? '')) return null

  const { stripe, config } = createStripeClient()
  if (!stripe) {
    return apiError(503, 'stripe_not_configured', config.error ?? 'Stripe is not configured')
  }

  try {
    await stripe.subscriptions.update(subscriptionId, {
      metadata: {
        user_id: '',
        account_deleted: 'true',
        account_deleted_at: new Date().toISOString(),
      },
    })
    await stripe.subscriptions.cancel(subscriptionId, {
      invoice_now: false,
      prorate: false,
      cancellation_details: {
        comment: 'Account deleted by customer.',
      },
    })
  } catch (error) {
    if (!isStripeResourceMissing(error)) {
      return apiError(502, 'stripe_cancel_failed', 'Could not cancel the active subscription. Contact support.')
    }
  }

  return null
}

async function removeAvatarObjects(admin: ReturnType<typeof createAdminClient>, userId: string) {
  for (;;) {
    const { data, error } = await admin.storage
      .from('avatars')
      .list(userId, { limit: 100 })

    if (error) return apiError(500, 'avatar_delete_failed', 'Could not delete profile media.')
    if (!data?.length) return null

    const paths = data.map(item => `${userId}/${item.name}`)
    const { error: removeError } = await admin.storage.from('avatars').remove(paths)
    if (removeError) return apiError(500, 'avatar_delete_failed', 'Could not delete profile media.')
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError(401, 'unauthorized', 'Unauthorized')
  if (!hasValidReauthToken(request, user.id)) {
    return apiError(403, 'reauth_required', 'reauth_required')
  }

  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await request.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, 'invalid_request_body', 'Invalid request body', { issues: validationIssues(error) })
    }
    return apiError(400, 'invalid_json_body', 'Invalid JSON body')
  }
  const { email, confirmation } = body

  if (!user.email || email !== user.email.toLowerCase() || confirmation !== 'DELETE') {
    return apiError(400, 'confirmation_mismatch', 'Account deletion confirmation did not match.')
  }

  const admin = createAdminClient()
  const { data: subscription, error: subscriptionError } = await admin
    .from('subscriptions')
    .select('stripe_subscription_id, status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (subscriptionError) {
    return apiError(500, 'subscription_lookup_failed', 'Could not prepare account deletion.')
  }

  const cancelError = await cancelStripeSubscriptionIfNeeded(subscription as SubscriptionDeletionRow | null)
  if (cancelError) return cancelError

  const { error: subscriptionUpdateError } = await admin
    .from('subscriptions')
    .update({
      plan: 'free',
      status: 'canceled',
      cancel_at_period_end: false,
      cancel_at: null,
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (subscriptionUpdateError) {
    return apiError(500, 'subscription_cleanup_failed', 'Could not prepare account deletion.')
  }

  const avatarError = await removeAvatarObjects(admin, user.id)
  if (avatarError) return avatarError

  const { error: profileDeleteError } = await admin.from('profiles').delete().eq('id', user.id)
  if (profileDeleteError) {
    return apiError(500, 'profile_delete_failed', 'Could not delete account.')
  }

  const { error: authDeleteError } = await admin.auth.admin.deleteUser(user.id)
  if (authDeleteError) return apiError(500, 'auth_delete_failed', 'Could not delete account.')

  await sendAccountDeletedEmail(admin, {
    dedupeKey: `account-deleted:${user.id}`,
    to: user.email,
  })

  const response = NextResponse.json({ ok: true })
  response.cookies.delete(REAUTH_COOKIE_NAME)
  return response
}
