# Autopsy Drafts — Deferred Stories

Stories where research could not reach even the gap-acknowledgement bar — no primary source found, claim too speculative to publish, or the product is too underdocumented to write responsibly.

**Phase 1 result: zero deferred stories.**

All 100 stories in the queue were drafted. Twenty of the 100 have acknowledged research gaps in their `researchGaps:` front matter field — those are complete drafts with uncertain claims marked explicitly, not deferred stories. None fell below the minimum bar of three named, sourced facts per story.

See [INDEX.md](./INDEX.md) for the full list with research-gap annotations.

---

## Stories with significant research gaps (for Phase 2 review)

These are drafted, not deferred. They are flagged here so the Phase 2 port review can decide whether to fill the gaps with additional research or publish with the acknowledgements in place.

| Slug | Company | Gap |
|---|---|---|
| google-amp | Google | Limited public post-mortems on the AMP deprecation decision |
| facebook-workplace | Meta | Internal adoption rates and enterprise customer data not public |
| microsoft-loop | Microsoft | Product too young; adoption limited; key decisions not yet documented |
| google-stadia | Google | Internal failure documents not public; team interviews limited |
| amazon-alexa-skills | Amazon | Skill adoption metrics not disclosed |
| spotify-podcasts | Spotify | Anchor acquisition ROI and podcast-specific metrics not public |
| lyft-pink | Lyft | Retention improvement attributable to Lyft Pink not sourced |
| airbnb-experiences | Airbnb | Revenue mix between Experiences and home rentals not disclosed |
| tripadvisor-forums | TripAdvisor | UGC contribution rates and user demographics not public |
| headspace-sleep-sounds | Headspace | Feature-specific retention impact not disclosed |
| fitbit-challenges | Fitbit | Challenge engagement rates not public |
| sendgrid-activity-feed | SendGrid | Feature adoption data not disclosed |
| amplitude-charts | Amplitude | Competitive differentiation data limited to press claims |
| webpack-module-federation | Webpack | Enterprise vs. community adoption split not researched |
| sentry-performance-monitoring | Sentry | Conversion from error-only to APM plans not disclosed |
| producthunt-ship | Product Hunt | Ship subscriber count and revenue data not public |
| bear-notes | Bear (Shiny Frog) | Revenue and download figures for Shiny Frog not public |
| wordle-clone-market | NYT | Exact acquisition price; post-NYT daily active users |

---

## Notes for Phase 2 curators

For each research-gap story, the draft's `researchGaps:` YAML field lists the specific unknowns. The prose uses "reportedly," "according to," and explicit hedges where gaps exist. Phase 2 reviewers should:

1. Attempt to fill each gap with additional research before porting to the data layer.
2. If a gap cannot be filled, confirm the existing hedge language is sufficient for publication.
3. If a gap fundamentally undermines the story's argument (e.g., a claimed metric is central to the takeaway and cannot be sourced), flag for editorial revision before publishing.

No story requires a full rewrite — all gaps are around supporting data, not the core narrative claim.
