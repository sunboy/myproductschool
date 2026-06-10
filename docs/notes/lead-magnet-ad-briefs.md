# Lead-Magnet Ad Briefs — Paid Social (IG / TikTok)

The creative system for driving paid-social traffic into the `/go/*` instant funnels.
Generation: poses via the Codex companion from the official mascot (`public/images/hatch/hatch-official-mascot.png`),
composites via `node scripts/ad-creatives/render.mjs`, review sheet at `docs/notes/ad-creatives/index.html`.
Every hook passes `scripts/ad-creatives/compliance-lint.mjs` mechanically before render.

## Research grounding (2026)

- Character/mascot ads outperform: Duolingo runs 15-22% engagement against ~4% platform medians; controlled studies (System1, MPC, IPA) show characters beat non-characters on profit, share, and acquisition.
- Top creative patterns for this category: (1) mascot grade-my-answer, (2) 5-slide carousel quiz teasers (+20-30% CTR vs single image), (3) contrarian "stop doing X" hooks, (4) score-meter statics for retargeting, (5) POV native text overlays.
- Static still wins for retargeting; video wins cold. TikTok 9:16 (1080x1920) with 120px top/bottom safe zones; IG feed 1:1 and 4:5.
- Refresh cadence: swap hook copy every 7-10 days (CTR drops ~30% past 4-6 impressions/user/week). Poses are evergreen; a refresh is a manifest copy-edit + re-render.

## UTM scheme

`utm_source={tiktok|instagram}` · `utm_medium=paid_social` · `utm_campaign=lm-{series}-{yyyymm}` · `utm_content={creative-id}`
Captured first-touch by the destination (`src/lib/lead-magnets/utm.ts`) into `magnet_result.utm` and PostHog
(`lead_magnet_lead_captured` carries utm_source/campaign/content), so CAC reads out per creative.

## The 7 series

| # | Series | Template | Destination | Platform treatment |
|---|---|---|---|---|
| S1 | Hatch graded it | graded-card | /go/spot-the-flaw/i | IG polished static + 5-slide carousel; TikTok 9:16 |
| S2 | We're looking for… | job-post | /go/ai-pm-readiness/i | IG 1:1 + 4:5 |
| S3 | Where do you land? | meter | /go/failure-mode/i | Retargeting workhorse, all ratios |
| S4 | Beat Hatch | duel | /go/teardown/i | TikTok 9:16 + carousel |
| S5 | The egg | poster + flow video | /go/failure-mode/i | TikTok video-first; IG statics |
| S6 | 2023 prep | poster | /go/ai-pm-readiness/i | TikTok native/POV style |
| S7 | Salary bands | meter variant | /go/salary/i | IG 1:1 + 4:5; citation chip mandatory |

Hook copy lives in `scripts/ad-creatives/manifest.mjs` (the source of truth; this doc does not duplicate it).

### Carousel plans (S1, S4)

slide 1 challenge hook → slide 2 the question → slide 3 the four options (no verdict) →
slide 4 score distribution ("Only 23% get this right") → slide 5 CTA + waving Hatch.
TikTok carousels require music (added in ads manager).

## Compliance cheat sheet (enforced by compliance-lint.mjs)

| Banned | Use instead |
|---|---|
| "Go from $180k to $260k" (income promise) | "Levels.fyi publishes the bands. The gap between two bands is usually one interview round." |
| Literal salary figures in copy | Band-ladder visuals with a "bands: levels.fyi" citation chip, no dollar figures |
| "Are you struggling / still getting rejected" (second-person deficit) | "The pattern behind rejected answers, and what changes it." |
| Before/after diptychs or labels | "Two answers to the same question. Same engineer, different habit." |
| Guarantees ("will get you hired") | Capability claims about the product, outcomes as observations |
| Contrarian hooks aimed at the person | Aim at the prep: "Stop rehearsing STAR stories." |

Mascot direct-address ("Hatch graded… Hatch bets you miss this one") is the default voice — compliance-safe and the strongest scroll-stop pattern for this brand.

Employment Special Ad Category: frame everything as skill development / practice, never job placement or certification, to stay outside Meta's Employment SAC targeting restrictions.

## Video

**Now:** `scripts/ad-creatives/capture-flow-video.mjs` records the real `/go/failure-mode/i` flow (taps with visible ripples → triple-tap egg crack → result card) as a native-style 9:16 capture. Good enough for TikTok native test cells. If the Lottie stutters on-device, the scoped upgrade is deterministic frame-stepping (drive `goToAndStop` per frame, screenshot, ffmpeg 30fps).

**Storyboards for later production (≤15s each, 9:16, text in safe zones, no audio — TikTok music added in ads manager):**

1. **Grade it live.** 0-2s answer card slides in, headline "Hatch is grading a real answer." 2-6s red pen circles the fatal phrase (pose: hatch-red-pen). 6-9s stamp slams "4/10 · SURFACE" (hatch-stamp). 9-13s meter fills to band 1 of 3. 13-15s CTA card "Spot the flaw yourself" + hatch-wave-cta.
2. **The duel.** 0-2s split screen, smug Hatch left (hatch-smug), empty YOU card right. 2-7s a real product decision appears; Hatch's side answers instantly with a thunk; your side blinks empty. 7-12s second decision, same beat, taunt line "Hatch is 2 for 2." 12-15s "Your move." CTA.
3. **Egg hero.** 0-3s idle egg bobbing (egg-idle Lottie), text "Four questions are between you and this egg." 3-9s question counter ticks 1→4, crack grows per tick. 9-13s hatch-pop burst (egg-hatch-img Lottie). 13-15s result card + CTA "Crack yours."

## Refresh workflow

1. Edit hooks in `manifest.mjs` (new ids, keep series).
2. `node scripts/ad-creatives/render.mjs && node scripts/ad-creatives/contact-sheet.mjs`
3. Review `docs/notes/ad-creatives/index.html`, upload survivors, archive beaten ids in the manifest with a `retired: 'yyyymmdd'` note.
