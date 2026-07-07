import { NextResponse, type NextRequest } from 'next/server'
import { sendNewsletterIssueEmail } from '@/lib/email/newsletter'
import { configuredReplyTo } from '@/lib/email/client'
import { createAdminClient } from '@/lib/supabase/admin'

// Newsletter blast cron for "The HackProduct Letter".
//
// GET, Bearer CRON_SECRET. Re-invocable by design: each call pages through
// `newsletter_subscribers` (status='subscribed', ordered by id), skips rows
// already recorded as sent in email_dedupes, sends sequentially up to
// `limit` (default 200), and stamps blog_posts.newsletter_sent_at once the
// unsent tail is drained. Safe to run repeatedly (e.g. every 5 minutes)
// while a blast is in flight.
//
// Dedupe key: newsletter:{postId}:{subscriberId}
//
// Test mode (?test=1 or ?test=<email>): sends exactly one email to the
// founder inbox (configuredReplyTo()), never touches newsletter_subscribers
// or blog_posts.newsletter_sent_at. Dedupe key includes Date.now() so a
// founder can re-trigger a test send repeatedly.

const DEFAULT_LIMIT = 200

interface BlogPostRow {
  id: string
  slug: string
  title: string
  dek: string | null
  body_markdown: string
  hero_image_url: string | null
  status: string
  newsletter_sent_at: string | null
}

interface SubscriberRow {
  id: string
  email: string
  email_norm: string
  status: string
  unsubscribe_token: string
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`)
}

function appUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.hackproduct.com'
  return new URL(path, base).toString()
}

function unsubscribeUrlForToken(token: string) {
  return `https://www.hackproduct.com/api/newsletter/unsubscribe?t=${encodeURIComponent(token)}`
}

function canonicalUrlForPost(post: BlogPostRow) {
  return appUrl(`/blog/${post.slug}`)
}

function hatchIntroForPost(post: BlogPostRow) {
  return post.dek
    ? `Hey, it's Hatch. ${post.dek}`
    : "Hey, it's Hatch. Here's this week's issue of The HackProduct Letter."
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized()

  const postId = request.nextUrl.searchParams.get('postId')
  if (!postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 })
  }

  const limitParam = request.nextUrl.searchParams.get('limit')
  const limit = Math.max(1, Math.min(1000, Number(limitParam) || DEFAULT_LIMIT))
  const testParam = request.nextUrl.searchParams.get('test')

  const admin = createAdminClient()

  const { data: post, error: postError } = await admin
    .from('blog_posts')
    .select('id, slug, title, dek, body_markdown, hero_image_url, status, newsletter_sent_at')
    .eq('id', postId)
    .maybeSingle()

  if (postError) {
    return NextResponse.json({ error: 'Could not load post.' }, { status: 500 })
  }
  if (!post) {
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
  }
  const typedPost = post as BlogPostRow
  if (typedPost.status !== 'published') {
    return NextResponse.json({ error: 'Post is not published.' }, { status: 409 })
  }

  const canonicalUrl = canonicalUrlForPost(typedPost)
  const subject = typedPost.title

  // ─── Test mode: one send, to the founder, no subscriber reads/writes ─────
  if (testParam) {
    const to = testParam.includes('@') ? testParam : configuredReplyTo()
    const dedupeKey = `newsletter-test:${typedPost.id}:${Date.now()}`
    const testUnsubscribeUrl = appUrl('/api/newsletter/unsubscribe?t=test')

    await sendNewsletterIssueEmail(admin, {
      dedupeKey,
      to,
      subject,
      title: typedPost.title,
      dek: typedPost.dek,
      bodyMarkdown: typedPost.body_markdown,
      heroImageUrl: typedPost.hero_image_url,
      hatchIntro: hatchIntroForPost(typedPost),
      unsubscribeUrl: testUnsubscribeUrl,
      canonicalUrl,
    })

    return NextResponse.json({ test: true, to, dedupeKey })
  }

  // ─── Full mode: page subscribed rows, resume-safe via email_dedupes ──────
  const { data: subscribersData, error: subscribersError } = await admin
    .from('newsletter_subscribers')
    .select('id, email, email_norm, status, unsubscribe_token')
    .eq('status', 'subscribed')
    .order('id', { ascending: true })
    .limit(5000)

  if (subscribersError) {
    return NextResponse.json({ error: 'Could not load subscribers.' }, { status: 500 })
  }

  const subscribers = (subscribersData ?? []) as SubscriberRow[]
  if (subscribers.length === 0) {
    await admin
      .from('blog_posts')
      .update({ newsletter_sent_at: typedPost.newsletter_sent_at ?? new Date().toISOString() })
      .eq('id', typedPost.id)
    return NextResponse.json({ done: true, attempted: 0, sent: 0, skipped: 0 })
  }

  const dedupeKeys = subscribers.map(sub => `newsletter:${typedPost.id}:${sub.id}`)
  const { data: sentDedupes, error: dedupeError } = await admin
    .from('email_dedupes')
    .select('dedupe_key')
    .eq('status', 'sent')
    .in('dedupe_key', dedupeKeys)

  if (dedupeError) {
    return NextResponse.json({ error: 'Could not load send history.' }, { status: 500 })
  }

  const alreadySent = new Set((sentDedupes ?? []).map(row => row.dedupe_key as string))
  const unsent = subscribers.filter(sub => !alreadySent.has(`newsletter:${typedPost.id}:${sub.id}`))

  let attempted = 0
  let sent = 0

  const batch = unsent.slice(0, limit)
  for (const subscriber of batch) {
    const dedupeKey = `newsletter:${typedPost.id}:${subscriber.id}`
    const unsubscribeUrl = unsubscribeUrlForToken(subscriber.unsubscribe_token)

    attempted += 1
    await sendNewsletterIssueEmail(admin, {
      dedupeKey,
      to: subscriber.email,
      subject,
      title: typedPost.title,
      dek: typedPost.dek,
      bodyMarkdown: typedPost.body_markdown,
      heroImageUrl: typedPost.hero_image_url,
      hatchIntro: hatchIntroForPost(typedPost),
      unsubscribeUrl,
      canonicalUrl,
    })

    const { data: emailEvent } = await admin
      .from('email_dedupes')
      .select('status')
      .eq('dedupe_key', dedupeKey)
      .maybeSingle()

    if (emailEvent?.status === 'sent') {
      sent += 1
      await admin
        .from('newsletter_subscribers')
        .update({ last_sent_at: new Date().toISOString() })
        .eq('id', subscriber.id)
    }
  }

  const remainingUnsent = unsent.length - batch.length
  if (remainingUnsent <= 0) {
    await admin
      .from('blog_posts')
      .update({ newsletter_sent_at: new Date().toISOString() })
      .eq('id', typedPost.id)
    return NextResponse.json({ done: true, attempted, sent, remaining: 0 })
  }

  return NextResponse.json({ done: false, attempted, sent, remaining: remainingUnsent })
}
