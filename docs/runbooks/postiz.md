# Postiz — self-hosted social publishing (postiz.hackproduct.com)

Self-hosted Postiz replaces the $49/mo managed plan. Runs ~$30/mo on GCP and gives unlimited channels, unlimited posts, and full API access for the Claude publisher agents.

## Where it runs

| Piece | Value |
|---|---|
| URL | https://postiz.hackproduct.com |
| VM | `postiz` (e2-medium, 4GB + 2GB swap, 25GB pd-balanced), zone `us-central1-a`, project `hackproduct` |
| Static IP | `postiz-ip` → 34.41.51.14 (A record on Vercel DNS) |
| Stack | `/opt/postiz/docker-compose.yml` — caddy (TLS), postiz app, postgres:17, redis:7.2, temporal + temporal-postgres |
| Secrets | `/opt/postiz/.env` (JWT secret, DB password, Resend key) — chmod 600, never in git |
| Firewall | `postiz-allow-http` (80/443, tag `postiz-server`) |

## Operate

```bash
# SSH
gcloud compute ssh postiz --zone=us-central1-a --project=hackproduct

# Status / logs / restart
cd /opt/postiz
sudo docker compose ps
sudo docker compose logs postiz --tail 100
sudo docker compose restart postiz

# Upgrade Postiz (pin nothing; :latest by design)
sudo docker compose pull postiz && sudo docker compose up -d postiz

# Env change (requires full recreate, not restart)
sudo docker compose down && sudo docker compose up -d
```

## First-time setup for founders

1. Both founders register at https://postiz.hackproduct.com/auth (email + password; Resend delivers activation emails).
2. First founder: Settings → Team → invite the cofounder's email so both share one workspace and its channels.
3. **Then close registration**: edit `/opt/postiz/docker-compose.yml`, set `DISABLE_REGISTRATION: 'true'`, run `sudo docker compose up -d postiz`. Do not skip this — the register page is public until you do.

## Connecting social channels (per-platform OAuth apps)

Self-hosted Postiz needs your own OAuth app per platform. Set the credentials in the `postiz` service environment in `/opt/postiz/docker-compose.yml`, then `docker compose up -d`:

| Platform | Env vars | Notes |
|---|---|---|
| X | `X_API_KEY`, `X_API_SECRET` | Needs an X developer app; free tier posts with limits |
| LinkedIn | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | Request the Community Management/Advertising API product on the app or token refresh fails |
| Facebook + Instagram | `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` | One Meta app serves both |
| YouTube | `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET` | Google Cloud OAuth client; YouTube Data API v3 enabled |

Redirect URLs use the `https://postiz.hackproduct.com` origin — Postiz shows the exact callback per provider when you add a channel.

## Agents drive it

The publisher cron flow (Linear `growth:approved` → schedule → permalink back on the issue) talks to this instance's API. Generate an API key in Postiz Settings once the founder account exists, and store it where the publisher agent reads env.

## Costs

e2-medium ~$24.5/mo + 25GB pd-balanced ~$2.5/mo + static IP ~$3/mo ≈ **$30/mo**. Nothing else is metered.

## Gotchas

- Postgres data, uploads, and Caddy certs live in named Docker volumes on the VM disk — deleting the VM deletes history. Snapshot the disk before risky changes: `gcloud compute disks snapshot postiz --zone=us-central1-a`.
- Temporal is mandatory for scheduling (Postiz ≥ v2.12); it runs with SQL visibility (`ENABLE_ES=false`) to fit in 4GB.
- Env vars only apply on container recreate (`up -d`), not `restart`.
- Never schedule Reddit posts through Postiz — Reddit stays manual per the growth playbook.
