import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/leads/unsubscribe?t={report_token}
//
// Marks a lead as unsubscribed (sets unsubscribed_at = now()) so they no
// longer receive nurture emails. The response is always a small branded HTML
// page — identical neutral copy for invalid/missing tokens to prevent token
// enumeration.
//
// The lead's personal report link continues to work regardless; this only
// stops further emails.

const PRIMARY = '#2d5a3d'
const BG = '#f8f3ea'
const INK = '#233028'
const MUTED = '#4f5a51'
const BORDER = '#d7d2c8'

function htmlPage(
  heading: string,
  body: string,
  showReportNote: boolean
) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Unsubscribed — HackProduct</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: ${BG}; font-family: Inter, Arial, sans-serif; color: ${INK}; }
    .wrap { max-width: 480px; margin: 0 auto; padding: 60px 24px; }
    .card { background: #fff; border: 1px solid ${BORDER}; border-radius: 18px; overflow: hidden; }
    .bar { background: ${PRIMARY}; padding: 22px 24px; }
    .bar-label { font-size: 11px; text-transform: uppercase; letter-spacing: .14em; font-weight: 800; color: rgba(255,255,255,.62); }
    .bar-heading { margin-top: 8px; font-size: 22px; font-weight: 700; color: #fff; line-height: 1.2; }
    .body { padding: 24px; }
    .body p { font-size: 15px; line-height: 1.7; color: ${MUTED}; }
    .body p + p { margin-top: 12px; }
    .footer { margin-top: 20px; font-size: 12px; color: #74796e; line-height: 1.6; text-align: center; }
    .footer a { color: ${PRIMARY}; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="wrap">
    <div style="margin-bottom:20px;">
      <svg width="120" height="32" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="HackProduct">
        <text x="0" y="24" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="800" fill="${PRIMARY}">HackProduct</text>
      </svg>
    </div>
    <div class="card">
      <div class="bar">
        <div class="bar-label">Email preferences</div>
        <div class="bar-heading">${heading}</div>
      </div>
      <div class="body">
        <p>${body}</p>
        ${showReportNote ? `<p>Your personal report link still works. This only stops further emails about this topic.</p>` : ''}
      </div>
    </div>
    <p class="footer">
      <a href="https://hackproduct.com">hackproduct.com</a>
    </p>
  </div>
</body>
</html>`
}

function htmlResponse(html: string, status = 200) {
  return new NextResponse(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

const NEUTRAL_PAGE = htmlPage(
  'Email preferences updated.',
  'You will not receive further emails about this topic from HackProduct.',
  false
)

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('t')

  // Missing or obviously invalid token — return neutral page without querying.
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
    return htmlResponse(NEUTRAL_PAGE)
  }

  const admin = createAdminClient()

  // Look up lead by report_token.
  const { data: lead, error: selectError } = await admin
    .from('leads')
    .select('id, unsubscribed_at')
    .eq('report_token', token)
    .maybeSingle()

  if (selectError || !lead) {
    // Token not found — same neutral page, no enumeration signal.
    return htmlResponse(NEUTRAL_PAGE)
  }

  // Already unsubscribed — idempotent, same success page.
  if (!lead.unsubscribed_at) {
    const { error: updateError } = await admin
      .from('leads')
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq('id', lead.id)
      .is('unsubscribed_at', null)

    if (updateError) {
      console.error('[leads/unsubscribe] update error', { id: lead.id, error: updateError.message })
    }
  }

  const successHtml = htmlPage(
    'You are unsubscribed.',
    'You will not receive further emails about this topic from HackProduct.',
    true
  )

  return htmlResponse(successHtml)
}
