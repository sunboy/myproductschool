# Status Page

Public URL: `https://status.hackproduct.com`

Launch setup:

- Create a Statuspage, Better Stack, or equivalent status page before DNS cutover.
- Add monitors for the web app, Supabase auth, Stripe checkout, Stripe webhook delivery, Resend email, and Hatch coaching routes.
- Point `status.hackproduct.com` to the provider.
- Keep the footer link active even before incidents exist so users have a stable place to check availability.

Operational note: this repository only adds the public link and setup note. DNS and provider setup happen outside the codebase.
