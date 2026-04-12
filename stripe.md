# Stripe Setup — Pending Steps

## What's Done
- Publishable key set in `.env.local` (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
- Annual price ID set: `price_1TLA97EGJUB78L7ngjZRwz8Y`
- Monthly price ID set: `price_1TLA97EGJUB78L7nf8fBRt7J`
- Buy Button IDs wired in `UpgradeModal.tsx`:
  - Monthly: `buy_btn_1TKsvjEGJUB78L7nTQD8uAjD`
  - Annual: `buy_btn_1TKswkEGJUB78L7nSgCf0pvi`
- Migration `045_subscriptions_billing_interval.sql` pushed — `subscriptions` table has `billing_interval` and `stripe_price_id` columns
- Webhook handler at `/api/stripe/webhook` handles `checkout.session.completed`, `customer.subscription.created/updated/deleted`

## Pending — Needs Standard Secret Key

### Current key (`mk_1Pnt7sEGJUB78L7naxFkCSLi`) — set in `.env.local`
This is a restricted/legacy-format key. It works for server-side API calls but the
Stripe CLI rejects it ("legacy-style API key unsupported").

To use the CLI for local webhook forwarding, generate a standard secret key:
Stripe Dashboard → Developers → API keys → Create secret key (type: Standard)
It will start with `sk_live_...` (prod) or `sk_test_...` (test mode).

### 1. Replace secret key in `.env.local`
```
STRIPE_SECRET_KEY=sk_live_...   # or sk_test_... for test mode
```

### 2. Get webhook signing secret (local dev)
Once standard key is set, run:
```bash
stripe listen --api-key sk_live_... --forward-to localhost:3000/api/stripe/webhook \
  --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted
```
Copy the `whsec_...` value printed on startup and add to `.env.local`:
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Get webhook signing secret (production)
In Stripe Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://your-domain.com/api/stripe/webhook`
- Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

Copy the signing secret (`whsec_...`) and set it in your production env.

### 4. Verify end-to-end locally
```bash
# In terminal 1 — dev server
npm run dev

# In terminal 2 — webhook listener
stripe listen --forward-to localhost:3000/api/stripe/webhook \
  --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted

# In terminal 3 — trigger a test checkout
stripe trigger checkout.session.completed
```
Check that `profiles.plan` updates to `'pro'` in Supabase after the event fires.
