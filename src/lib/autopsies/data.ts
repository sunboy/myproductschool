import type { CompanyHub, FeatureAutopsy, QuickReadCard } from './types'
import { generatedDraftCompanyHubs, generatedDraftFeatureAutopsies } from './generated-draft-data'
import { withAutopsyStorageImages } from './storage'

const FIRST_50_TOPICS = [
  ['spotify', 'Spotify', 'spotify-wrapped', 'Spotify Wrapped', 'A year-end recap became a shareable identity ritual.'],
  ['google', 'Google', 'gmail-undo-send', 'Gmail Undo Send', 'A delay made a destructive action feel reversible.'],
  ['facebook', 'Facebook', 'facebook-like-button', 'Facebook Like Button', 'A tiny reaction primitive changed feedback loops.'],
  ['whatsapp', 'WhatsApp', 'whatsapp-blue-ticks', 'WhatsApp Blue Ticks', 'Read receipts turned message status into social pressure.'],
  ['whatsapp', 'WhatsApp', 'whatsapp-groups', 'WhatsApp Groups', 'Small-group coordination became the product center of gravity.'],
  ['instagram', 'Instagram', 'instagram-filters-burbn-pivot', 'Instagram Filters, Burbn Pivot', 'A crowded social app narrowed to one fast photo habit.'],
  ['wordle', 'Wordle', 'wordle-one-puzzle-a-day', 'Wordle', 'One daily puzzle created scarcity, routine, and social proof.'],
  ['dropbox', 'Dropbox', 'dropbox-referral-program', 'Dropbox Referral Program', 'Free storage made referral feel like a useful gift.'],
  ['twitter', 'Twitter', 'twitter-hashtag', 'Twitter Hashtag', 'A user convention became product infrastructure.'],
  ['duolingo', 'Duolingo', 'duolingo-streak', 'Duolingo Streak', 'A counter turned practice consistency into a visible asset.'],
  ['tinder', 'Tinder', 'tinder-swipe', 'Tinder Swipe', 'A gesture compressed matching into a fast binary choice.'],
  ['stripe', 'Stripe', 'stripe-seven-line-integration', 'Stripe 7-Line Integration', 'Developer setup became the product promise.'],
  ['airbnb', 'Airbnb', 'airbnb-craigslist-hack', 'Airbnb Craigslist Hack', 'Distribution came from meeting supply where it already lived.'],
  ['notion', 'Notion', 'notion-slash-command', 'Notion Slash Command', 'One keystroke hid complexity without removing power.'],
  ['calendly', 'Calendly', 'calendly-scheduling-link', 'Calendly Scheduling Link', 'A URL replaced a repeated coordination loop.'],
  ['linkedin', 'LinkedIn', 'linkedin-pymk', 'LinkedIn PYMK', 'Graph suggestions made a professional network feel alive.'],
  ['youtube', 'YouTube', 'youtube-autoplay', 'YouTube Autoplay', 'The next video became the default path.'],
  ['figma', 'Figma', 'figma-multiplayer', 'Figma Multiplayer', 'Live cursors turned design from file handoff into shared workspace.'],
  ['slack', 'Slack', 'slack-emoji-reactions', 'Slack Emoji Reactions', 'A lightweight signal reduced reply noise in team chat.'],
  ['facebook', 'Facebook', 'facebook-birthday-reminders', 'Facebook Birthday Reminders', 'A social obligation became a retention loop.'],
  ['netflix', 'Netflix', 'netflix-are-you-still-watching', 'Netflix Are You Still Watching', 'A pause prompt balanced engagement with account integrity.'],
  ['google', 'Google', 'google-did-you-mean', 'Google Did You Mean', 'Search corrected intent without making the user feel wrong.'],
  ['dark-sky', 'Dark Sky', 'dark-sky-minute-forecast', 'Dark Sky', 'Weather became useful at the minute level.'],
  ['flux', 'f.lux', 'flux-circadian-screen-tint', 'f.lux', 'A simple screen shift reframed comfort as timing.'],
  ['honey', 'Honey', 'honey-coupon-checkout', 'Honey', 'Savings appeared at the exact moment of purchase anxiety.'],
  ['unsplash', 'Unsplash', 'unsplash-free-photo-supply', 'Unsplash', 'Free high-quality supply created its own distribution.'],
  ['product-hunt', 'Product Hunt', 'product-hunt-launch-surface', 'Product Hunt', 'A daily launch ritual made discovery legible.'],
  ['nomad-list', 'Nomad List', 'nomad-list-spreadsheet-to-product', 'Nomad List', 'A public spreadsheet became a market map.'],
  ['gumroad', 'Gumroad', 'gumroad-creator-sell-flow', 'Gumroad', 'Checkout for creators became a single-purpose workflow.'],
  ['buffer', 'Buffer', 'buffer-fake-landing-page-mvp', 'Buffer', 'A fake landing page tested demand before the product existed.'],
  ['hotmail', 'Hotmail', 'hotmail-ps-i-love-you', 'Hotmail PS: I Love You', 'An email footer turned every message into distribution.'],
  ['robinhood', 'Robinhood', 'robinhood-waitlist', 'Robinhood Waitlist', 'A visible queue made access feel scarce.'],
  ['typeform', 'Typeform', 'typeform-one-question-flow', 'Typeform', 'Forms became conversation instead of paperwork.'],
  ['bereal', 'BeReal', 'bereal-two-minute-window', 'BeReal 2-Min Window', 'A narrow posting window made authenticity enforceable.'],
  ['venmo', 'Venmo', 'venmo-social-feed', 'Venmo Social Feed', 'Payments became social traces by default.'],
  ['discord', 'Discord', 'discord-game-chat-wedge', 'Discord', 'Voice chat for games became community infrastructure.'],
  ['slack', 'Slack', 'slack-origin-pivot', 'Slack Origin', 'An internal tool outgrew the game it was built for.'],
  ['instagram', 'Instagram', 'instagram-stories', 'Instagram Stories', 'A copied format became a mainstream sharing layer.'],
  ['tailwind', 'Tailwind CSS', 'tailwind-utility-css', 'Tailwind CSS', 'Utility classes turned design constraints into code.'],
  ['prettier', 'Prettier', 'prettier-opinionated-formatting', 'Prettier', 'Opinionated formatting removed a whole category of debate.'],
  ['amazon', 'Amazon', 'amazon-one-click', 'Amazon 1-Click', 'Purchase friction became a patented advantage.'],
  ['superhuman', 'Superhuman', 'superhuman-onboarding', 'Superhuman Onboarding', 'A high-touch setup protected a premium email promise.'],
  ['midjourney', 'Midjourney', 'midjourney-discord-launch', 'Midjourney Discord Launch', 'A community channel became the product interface.'],
  ['perplexity', 'Perplexity', 'perplexity-answer-engine', 'Perplexity Early', 'Search shifted from links toward sourced answers.'],
  ['notebooklm', 'NotebookLM', 'notebooklm-audio-overviews', 'NotebookLM', 'Source-grounded notes became conversational study material.'],
  ['elevenlabs', 'ElevenLabs', 'elevenlabs-voice-cloning', 'ElevenLabs', 'Voice generation made quality and safety inseparable.'],
  ['cursor', 'Cursor', 'cursor-ai-native-editor', 'Cursor', 'An editor made AI assistance part of the coding surface.'],
  ['gamma', 'Gamma', 'gamma-ai-presentations', 'Gamma.app', 'Deck creation moved from blank canvas to structured prompt.'],
  ['vite', 'Vite', 'vite-dev-server', 'Vite', 'Fast feedback became the developer experience wedge.'],
  ['linear', 'Linear', 'linear-speed-as-product', 'Linear', 'Issue tracking competed on speed and taste.'],
] as const

const COMPANY_HUB_OVERRIDES: Partial<Record<string, Partial<CompanyHub>>> = {
  buffer: {
    dek: 'Buffer feature autopsies about validation, pricing signals, and calm company-building.',
    industry: 'Productivity',
    accent: '#2c7a52',
    thesis: 'Buffer belongs in the autopsy library because its earliest product decision shows how a founder can test demand, willingness to pay, and customer language before a working product exists.',
    timeline: [
      { date: '2010', label: 'Landing page validation before Buffer v1 shipped.' },
      { date: '2011', label: 'AngelPad and seed funding moved the product into company mode.' },
      { date: '2018', label: 'Investor buyout let Buffer operate on a calmer independent path.' },
      { date: '2024', label: 'Public interviews place Buffer at $22.3M ARR.' },
    ],
  },
}

const baseCompanyHubs: CompanyHub[] = Array.from(
  new Map(
    FIRST_50_TOPICS.map(([slug, name]) => [
      slug,
      ({
        ...({
          slug,
          name,
          dek: `${name} feature autopsies in the HackProduct research queue.`,
          industry: inferIndustry(slug),
          accent: inferAccent(slug),
          thesis: `${name} is included because at least one feature decision offers a clear product lesson that can be researched from public evidence.`,
          timeline: [
            { date: 'Research', label: 'Source pack and claim map required before drafting.' },
            { date: 'Editorial', label: 'Narrative structure, source drawer, proofreading, and image QA required before publish.' },
          ],
        } satisfies CompanyHub),
        ...(COMPANY_HUB_OVERRIDES[slug] ?? {}),
      } satisfies CompanyHub),
    ])
  ).values()
)

export const companyHubs: CompanyHub[] = mergeCompanyHubs([
  ...baseCompanyHubs,
  ...generatedDraftCompanyHubs,
])

const PILOT_STORY_OVERRIDES: Partial<Record<string, Partial<FeatureAutopsy>>> = {
  'spotify-wrapped': {
    status: 'proofreading',
    proofreadStatus: 'needs_edits',
    sourceSummary: 'Pilot research brief and generated image packet complete. Final proofreading still required before publish.',
    sources: [
      {
        id: 'sp-wrapped-decade',
        title: '10 Years of Spotify Wrapped',
        publisher: 'Spotify Newsroom',
        url: 'https://newsroom.spotify.com/2024-12-04/10-years-spotify-wrapped/',
        tier: 'A',
        accessedAt: '2026-05-16',
        supports: 'Wrapped lineage, Year in Music origin, 2019 in-app shift, and 2015 unique user scale.',
      },
      {
        id: 'sp-wrapped-made',
        title: 'How Your Wrapped Is Made',
        publisher: 'Spotify Newsroom',
        url: 'https://newsroom.spotify.com/2025-12-03/how-your-wrapped-is-made/',
        tier: 'A',
        accessedAt: '2026-05-16',
        supports: 'Data window, eligibility, story rules, and exclusions such as Private Mode and taste profile rules.',
      },
      {
        id: 'sp-support-wrapped',
        title: 'Spotify Wrapped',
        publisher: 'Spotify Support',
        url: 'https://support.spotify.com/mx-en/article/spotify-wrapped/',
        tier: 'A',
        accessedAt: '2026-05-16',
        supports: 'Current product behavior, eligibility, playlists, and share options.',
      },
      {
        id: 'sp-wrapped-2019',
        title: 'Spotify Wrapped 2019 Reveals Your Streaming Trends',
        publisher: 'Spotify Newsroom',
        url: 'https://newsroom.spotify.com/2019-12-05/spotify-wrapped-2019-reveals-your-streaming-trends-from-2010-to-now/',
        tier: 'A',
        accessedAt: '2026-05-16',
        supports: '2019 user experience, decade recap framing, and shareable social formats.',
      },
      {
        id: 'sp-q4-2023',
        title: 'Spotify Reports Fourth Quarter 2023 Earnings',
        publisher: 'Spotify Newsroom',
        url: 'https://newsroom.spotify.com/2024-02-06/spotify-reports-fourth-quarter-2023-earnings/',
        tier: 'A',
        accessedAt: '2026-05-16',
        supports: 'Official 2023 Wrapped scale, engagement growth, market count, and Spotify MAU context.',
      },
      {
        id: 'sp-time-2023',
        title: 'Your Complete Guide to Spotify Wrapped',
        publisher: 'TIME',
        url: 'https://time.com/6340656/spotify-wrapped-guide-2023/',
        tier: 'B',
        accessedAt: '2026-05-16',
        supports: 'Reported historical usage and sharing figures, with medium confidence.',
      },
      {
        id: 'sp-techcrunch-2015',
        title: "Spotify's Year in Music Recaps the Songs You Listened to Most in 2015",
        publisher: 'TechCrunch',
        url: 'https://techcrunch.com/2015/12/07/spotifys-year-in-music-recaps-the-songs-you-listened-to-most-in-2015/',
        tier: 'B',
        accessedAt: '2026-05-16',
        supports: '2015 launch coverage and product shape before the Wrapped brand.',
      },
    ],
    metrics: [
      { label: '2015 Year in Music reach', value: 'More than 5M unique users', confidence: 'high_confidence', sourceIds: ['sp-wrapped-decade'] },
      { label: '2023 Wrapped reach', value: 'More than 225M monthly active users touched Wrapped', confidence: 'confirmed', sourceIds: ['sp-q4-2023'] },
      { label: '2023 engagement growth', value: 'More than 40% year over year across 170 markets', confidence: 'confirmed', sourceIds: ['sp-q4-2023'] },
      { label: 'Reported 2021 sharing', value: 'Nearly 60M Wrapped stories and graphics shared', confidence: 'medium_confidence', sourceIds: ['sp-time-2023'] },
    ],
    images: createPilotImages('spotify-wrapped', 'Spotify Wrapped', 'personal listening recap as identity story'),
    quickRead: [
      {
        id: 'setup',
        title: 'Origin',
        body: 'Spotify’s Wrapped lineage starts with Year in Music in 2015, then becomes Wrapped in 2016. The 2015 version already used personal listening history as the product surface.',
        sourceIds: ['sp-wrapped-decade', 'sp-techcrunch-2015'],
        imageRole: 'hero',
        confidence: 'high_confidence',
      },
      {
        id: 'decision',
        title: 'Product mechanism',
        body: 'Wrapped converts listening logs into ranked, personal stories: minutes, top songs, artists, genres, podcasts, playlists, quizzes, and creator views. The exact rules vary by story.',
        sourceIds: ['sp-support-wrapped', 'sp-wrapped-made'],
        imageRole: 'hatch-narrator',
        confidence: 'high_confidence',
      },
      {
        id: 'wrong-obvious-answer',
        title: 'The obvious recap',
        body: 'The safer version was a static listening report. Wrapped treated the recap as a mobile story, which made identity and sharing part of the product surface.',
        sourceIds: ['sp-wrapped-2019', 'sp-wrapped-decade'],
        imageRole: 'failure-mechanism',
        confidence: 'medium_confidence',
      },
      {
        id: 'mechanism',
        title: 'Sharing loop',
        body: 'Sharing is built into the experience through recap cards and social distribution. The public sources support shareable cards and share options, not a precise channel-by-channel impact claim.',
        sourceIds: ['sp-support-wrapped', 'sp-wrapped-made'],
        imageRole: 'failure-mechanism',
        confidence: 'high_confidence',
      },
      {
        id: 'evidence',
        title: 'Public scale',
        body: 'The strongest official scale proof is 2023: more than 225M monthly active users touched Wrapped, with engagement up more than 40% year over year across 170 markets.',
        sourceIds: ['sp-q4-2023'],
        imageRole: 'evidence-card',
        confidence: 'confirmed',
      },
      {
        id: 'lesson',
        title: 'Evidence limits',
        body: 'Spotify does not publish full annual methodology, retention impact, conversion impact, or exact ranking formulas for every story. Public evidence supports the loop and scale, not subscriber causality.',
        sourceIds: ['sp-wrapped-made', 'sp-q4-2023'],
        imageRole: 'lesson-frame',
        confidence: 'high_confidence',
      },
    ],
    flow: [
      {
        move: 'Frame',
        title: 'Turn listening history into identity',
        body: [
          'The naive frame was reporting. Spotify already had listening logs, charts, playlists, and year-end lists. A report could tell users what they played most.',
          'Wrapped reframed that data as a personal story. The useful product was not only the list of songs. It was the moment a listener could recognize a version of themselves and post it.',
        ],
        sourceIds: ['sp-wrapped-decade', 'sp-techcrunch-2015', 'sp-wrapped-2019'],
      },
      {
        move: 'List',
        title: 'Choose the recap shape',
        body: [
          'Spotify could have shipped a static report, a private playlist, a global chart, or a mobile story. The public evidence points to a gradual move from recap to story, with 2019 marking the in-app shift.',
          'The mobile story format created a sharper tradeoff. It made the product more seasonal and more shareable, but also required story-specific methodology and eligibility rules.',
        ],
        sourceIds: ['sp-wrapped-decade', 'sp-wrapped-2019', 'sp-wrapped-made'],
      },
      {
        move: 'Optimize',
        title: 'Make sharing part of the product',
        body: [
          'Wrapped packages listening data into cards, playlists, and story-like modules. Spotify support and newsroom pages describe sharing surfaces as part of the experience, not a separate marketing ask.',
          'The optimization is restraint. A card has to compress a year of behavior into one recognizable proof point, then survive social crops without needing the whole app around it.',
        ],
        sourceIds: ['sp-support-wrapped', 'sp-wrapped-made', 'sp-wrapped-2019'],
      },
      {
        move: 'Win',
        title: 'Let scale speak carefully',
        body: [
          'The strongest official public metric is 2023: more than 225 million monthly active users touched Wrapped, and engagement was up more than 40 percent year over year across 170 markets.',
          'That proves reach and seasonal engagement. It does not prove subscriber conversion or retention causality, so the autopsy should stop at the evidence line.',
        ],
        sourceIds: ['sp-q4-2023', 'sp-time-2023'],
      },
    ],
  },
  'gmail-undo-send': {
    status: 'published',
    proofreadStatus: 'approved',
    sourceSummary: 'Six-source pack approved. Public evidence supports the Labs origin, delay-not-recall mechanism, 2015 graduation, and current 5, 10, 20, or 30 second cancellation settings. It does not support quantified adoption, retention, or conversion impact.',
    sources: [
      {
        id: 'gm-labs-undo',
        title: 'New in Labs: Undo Send',
        publisher: 'Official Gmail Blog',
        url: 'https://gmail.googleblog.com/2009/03/new-in-labs-undo-send.html',
        tier: 'A',
        accessedAt: '2026-05-16',
        supports: '2009 Labs origin, user problem examples, initial 5-second delay, and non-recall mechanism.',
      },
      {
        id: 'gm-labs-intro',
        title: 'Introducing Gmail Labs',
        publisher: 'Official Gmail Blog',
        url: 'https://gmail.googleblog.com/2008/06/introducing-gmail-labs.html',
        tier: 'A',
        accessedAt: '2026-05-16',
        supports: 'Gmail Labs as opt-in experimental feature channel.',
      },
      {
        id: 'gm-web-setting',
        title: 'Undo Send for Gmail on the Web',
        publisher: 'Google Workspace Updates',
        url: 'https://workspaceupdates.googleblog.com/2015/06/undo-send-for-gmail-on-web.html',
        tier: 'A',
        accessedAt: '2026-05-16',
        supports: '2015 graduation from Labs to a formal Gmail web setting and rollout details.',
      },
      {
        id: 'gm-help-unsend',
        title: 'Send or Unsend Gmail Messages',
        publisher: 'Gmail Help',
        url: 'https://support.google.com/mail/answer/2819488?hl=en-uk',
        tier: 'A',
        accessedAt: '2026-05-16',
        supports: 'Current cancellation period options and user flow.',
      },
      {
        id: 'gm-keyword-2023',
        title: 'How to Undo Send in Gmail for up to 30 Seconds',
        publisher: 'The Keyword',
        url: 'https://blog.google/products-and-platforms/products/gmail/how-to-unsend-email-gmail/',
        tier: 'A',
        accessedAt: '2026-05-16',
        supports: 'Current user flow, default 5-second window, desktop and mobile behavior.',
      },
      {
        id: 'gm-pcworld-2015',
        title: 'Google Finally Makes Undo Send an Official Gmail Feature',
        publisher: 'PCWorld',
        url: 'https://www.pcworld.com/article/428203/google-finally-makes-undo-send-an-official-gmail-feature.html',
        tier: 'B',
        accessedAt: '2026-05-16',
        supports: 'Trade press corroboration of the six-year Labs period and feature graduation.',
      },
    ],
    metrics: [
      { label: 'Labs launch date', value: 'Mar. 19, 2009', confidence: 'confirmed', sourceIds: ['gm-labs-undo'] },
      { label: 'Initial cancellation window', value: '5 seconds', confidence: 'confirmed', sourceIds: ['gm-labs-undo'] },
      { label: 'Formal Gmail web setting date', value: 'Jun. 23, 2015', confidence: 'confirmed', sourceIds: ['gm-web-setting'] },
      { label: 'Current max cancellation period', value: '30 seconds', confidence: 'confirmed', sourceIds: ['gm-help-unsend', 'gm-keyword-2023'] },
    ],
    images: createPilotImages('gmail-undo-send', 'Gmail Undo Send', 'short send delay as user safety buffer'),
    quickRead: [
      {
        id: 'setup',
        title: 'It started in Labs',
        body: 'Undo Send launched in Gmail Labs on Mar. 19, 2009. Labs was Gmail’s opt-in space for experiments, which let the team test a risky-feeling behavior outside the default send path.',
        sourceIds: ['gm-labs-undo', 'gm-labs-intro'],
        imageRole: 'hero',
        confidence: 'confirmed',
      },
      {
        id: 'decision',
        title: 'The problem was a few seconds wide',
        body: 'The public framing was immediate send regret: wrong recipient, missed attachment, visible mistake, or second thoughts right after pressing Send. The evidence supports the problem type, not its frequency.',
        sourceIds: ['gm-labs-undo', 'gm-keyword-2023'],
        imageRole: 'hatch-narrator',
        confidence: 'medium_confidence',
      },
      {
        id: 'wrong-obvious-answer',
        title: 'Recall was the tempting promise',
        body: 'A true recall sounds cleaner, but email quickly crosses systems Gmail does not control. The shipped answer avoided that promise by delaying delivery for a short window.',
        sourceIds: ['gm-labs-undo'],
        imageRole: 'failure-mechanism',
        confidence: 'high_confidence',
      },
      {
        id: 'mechanism',
        title: 'The mechanism was delay',
        body: 'Undo Send was not post-delivery recall. Gmail held the message briefly before sending. If the user clicked Undo during that window, Gmail returned them to compose.',
        sourceIds: ['gm-labs-undo', 'gm-help-unsend'],
        imageRole: 'failure-mechanism',
        confidence: 'confirmed',
      },
      {
        id: 'evidence',
        title: 'The evidence is durability',
        body: 'The feature stayed in Labs from 2009 until Jun. 23, 2015, when Google made it a formal Gmail web setting. Existing Labs users kept it on.',
        sourceIds: ['gm-web-setting', 'gm-pcworld-2015'],
        imageRole: 'evidence-card',
        confidence: 'confirmed',
      },
      {
        id: 'lesson',
        title: 'The lesson is bounded reversibility',
        body: 'The product adds a short safety buffer by delaying outbound delivery. More time protects against more quick mistakes, but it also makes Send feel slightly less immediate.',
        sourceIds: ['gm-help-unsend', 'gm-keyword-2023'],
        imageRole: 'lesson-frame',
        confidence: 'medium_confidence',
      },
    ],
    flow: [
      {
        move: 'Frame',
        title: 'A mistake that appears after the click',
        body: [
          'The product problem was not abstract regret. It was the very specific feeling of noticing a missing attachment, wrong recipient, typo, or second thought immediately after pressing Send.',
          'Gmail Labs gave the team a way to test that behavior without rewriting the meaning of email delivery for everyone. The experiment could stay small, opt-in, and reversible while the team learned whether the safety window was worth keeping.',
        ],
        sourceIds: ['gm-labs-undo', 'gm-labs-intro'],
      },
      {
        move: 'List',
        title: 'The recall promise was bigger than the product could own',
        body: [
          'The obvious copy would have been recall. That is also the dangerous promise. Once mail leaves Gmail, the result depends on recipient systems, clients, forwarding rules, and human behavior outside the product boundary.',
          'Undo Send chose a narrower contract. Gmail did not need to pull an email back from the world. It only needed to wait briefly before releasing the message, then give the sender one clean escape hatch during that wait.',
        ],
        sourceIds: ['gm-labs-undo', 'gm-help-unsend'],
      },
      {
        move: 'Optimize',
        title: 'The safety feature was really a timed buffer',
        body: [
          'The first Labs version held messages for 5 seconds. Current Gmail lets users choose a cancellation period of 5, 10, 20, or 30 seconds, with the same core idea underneath.',
          'That turns a destructive action into a bounded reversible one. The user still experiences Send as the primary action, but the interface keeps a short path back to compose while the mistake is fresh.',
          'The tradeoff is small and concrete. Longer cancellation periods protect against more quick mistakes. Shorter periods preserve the expectation that pressing Send moves the message along immediately.',
        ],
        sourceIds: ['gm-labs-undo', 'gm-help-unsend', 'gm-keyword-2023'],
      },
      {
        move: 'Win',
        title: 'The public win is durability, not a growth claim',
        body: [
          'Undo Send stayed in Labs from 2009 until 2015, when Google made it a formal Gmail web setting. Existing Labs users kept it on, and new users could enable it from settings.',
          'Google called the Labs feature popular, but the public record does not provide adoption, retention, or revenue impact. The careful conclusion is stronger because it is narrower: the behavior survived a long experiment channel and became a durable Gmail setting.',
        ],
        sourceIds: ['gm-web-setting', 'gm-pcworld-2015'],
      },
    ],
    backdropWord: 'UNDO',
    timeline: [
      {
        date: '2008',
        label: 'Gmail Labs opens the experiment lane',
        description: 'Labs gave Gmail a place to test opt-in features without changing the default product for everyone.',
        type: 'milestone',
      },
      {
        date: 'Mar. 19, 2009',
        label: 'Undo Send launches in Labs',
        description: 'The first public version held messages for 5 seconds so senders could cancel before delivery.',
        type: 'launch',
      },
      {
        date: 'Jun. 23, 2015',
        label: 'Undo Send becomes a formal Gmail web setting',
        description: 'Google moved the behavior out of Labs and into Gmail settings after a long public experiment.',
        type: 'milestone',
      },
      {
        date: 'Today',
        label: 'The cancellation window is configurable',
        description: 'Current Gmail settings let users choose 5, 10, 20, or 30 seconds.',
        type: 'today',
      },
    ],
    principle: {
      principle: 'Bound reversibility to the part of the system the product can truly control.',
      attribution: 'HackProduct autopsy lesson',
      sourceIds: ['gm-labs-undo', 'gm-help-unsend'],
    },
    sourcePackSummary: 'The references behind the dates, mechanics, and current settings live here. Unsupported impact claims are left out of the story.',
  },
  'facebook-like-button': {
    status: 'proofreading',
    proofreadStatus: 'needs_edits',
    sourceSummary: 'Pilot research brief and generated image packet complete. Final proofreading still required before publish.',
    sources: [
      {
        id: 'fb-reactions-2016',
        title: 'Reactions Now Available Globally',
        publisher: 'Meta',
        url: 'https://about.fb.com/news/2016/02/reactions-now-available-globally/',
        tier: 'A',
        accessedAt: '2026-05-16',
        supports: 'Official evolution of Like into Reactions and Facebook framing of lightweight emotional response.',
      },
      {
        id: 'fb-social-plugins',
        title: 'Social Plugins',
        publisher: 'Facebook Help',
        url: 'https://www.facebook.com/help/social-plugins',
        tier: 'A',
        accessedAt: '2026-05-16',
        supports: 'Current company description of Like, Share, and Comments plugins.',
      },
      {
        id: 'fb-cjeu-fashion-id',
        title: 'Fashion ID Case C-40/17 Press Release',
        publisher: 'Court of Justice of the European Union',
        url: 'https://curia.europa.eu/jcms/upload/docs/application/pdf/2019-07/cp190099en.pdf',
        tier: 'B',
        accessedAt: '2026-05-16',
        supports: 'Legal finding about data transmission and controllership around embedded Like button behavior.',
      },
      {
        id: 'fb-ftc-complaint',
        title: 'Substitute Amended Complaint, Facebook',
        publisher: 'Federal Trade Commission',
        url: 'https://www.ftc.gov/system/files/documents/cases/2021-09-08_redacted_substitute_amended_complaint_ecf_no._82.pdf',
        tier: 'B',
        accessedAt: '2026-05-16',
        supports: 'Open Graph, platform strategy, distribution claims, and social plugin adoption context.',
      },
      {
        id: 'fb-techcrunch-2010-launch',
        title: "Facebook: We'll Serve 1 Billion Likes on the Web in Just 24 Hours",
        publisher: 'TechCrunch',
        url: 'https://techcrunch.com/2010/04/21/facebook-like-button/',
        tier: 'C',
        accessedAt: '2026-05-16',
        supports: 'Contemporaneous F8 launch reporting and correction that 1 billion meant impressions.',
      },
      {
        id: 'fb-techcrunch-50000',
        title: "50,000 Websites Have Already Integrated Facebook's New Social Plugins",
        publisher: 'TechCrunch',
        url: 'https://techcrunch.com/2010/04/28/50000-websites-have-already-integrated-facebooks-new-social-plugins/',
        tier: 'C',
        accessedAt: '2026-05-16',
        supports: 'First-week adoption metric for Like Button or related social plugins.',
      },
      {
        id: 'fb-columbia-safe-button',
        title: 'Privacy-Preserving Social Plugins',
        publisher: 'USENIX Security 12',
        url: 'https://www.usenix.org/conference/usenixsecurity12/technical-sessions/presentation/kontaxis',
        tier: 'D',
        accessedAt: '2026-05-16',
        supports: 'Technical behavior and privacy analysis of embedded Like iframe patterns.',
      },
    ],
    metrics: [
      { label: 'External web launch date', value: 'Apr. 21, 2010', confidence: 'high_confidence', sourceIds: ['fb-techcrunch-2010-launch', 'fb-ftc-complaint'] },
      { label: 'First-week plugin adoption', value: '50,000 websites', confidence: 'high_confidence', sourceIds: ['fb-techcrunch-50000', 'fb-ftc-complaint'] },
      { label: 'Launch partners', value: '75 partner websites reported', confidence: 'medium_confidence', sourceIds: ['fb-techcrunch-2010-launch'] },
      { label: 'First-day 1B claim', value: 'Impressions, not confirmed clicks or likes', confidence: 'medium_confidence', sourceIds: ['fb-techcrunch-2010-launch'] },
    ],
    images: createPilotImages('facebook-like-button', 'Facebook Like Button', 'one-click feedback spreading across the web'),
    quickRead: [
      {
        id: 'setup',
        title: 'Origin',
        body: 'This autopsy uses the external web plugin as the researched feature boundary. The approved source pack establishes the 2010 F8 launch and later evolution into Reactions.',
        sourceIds: ['fb-techcrunch-2010-launch', 'fb-reactions-2016'],
        imageRole: 'hero',
        confidence: 'medium_confidence',
      },
      {
        id: 'decision',
        title: 'Public launch',
        body: 'The external Like Button launched at Facebook F8 on Apr. 21, 2010 as part of Open Graph and Social Plugins. It connected third-party sites back to Facebook.',
        sourceIds: ['fb-techcrunch-2010-launch', 'fb-ftc-complaint'],
        imageRole: 'hatch-narrator',
        confidence: 'high_confidence',
      },
      {
        id: 'wrong-obvious-answer',
        title: 'The obvious counter',
        body: 'A simple site-local counter would show popularity on one page. Facebook’s version turned a click into a portable social signal that could travel back into Facebook surfaces.',
        sourceIds: ['fb-techcrunch-2010-launch', 'fb-ftc-complaint'],
        imageRole: 'failure-mechanism',
        confidence: 'high_confidence',
      },
      {
        id: 'mechanism',
        title: 'Feedback mechanism',
        body: 'A click could signal interest in an object such as an article, song, restaurant, or movie. That signal could flow into profiles, News Feed, and Open Graph surfaces.',
        sourceIds: ['fb-techcrunch-2010-launch', 'fb-ftc-complaint'],
        imageRole: 'failure-mechanism',
        confidence: 'high_confidence',
      },
      {
        id: 'evidence',
        title: 'Web distribution',
        body: 'Adoption moved fast. Within one week, Facebook said 50,000 websites had added the Like Button or other Social Plugins, far beyond the launch partner set.',
        sourceIds: ['fb-techcrunch-50000', 'fb-ftc-complaint'],
        imageRole: 'evidence-card',
        confidence: 'high_confidence',
      },
      {
        id: 'lesson',
        title: 'Product tradeoff',
        body: 'The button gave publishers social proof and referral paths. The same design also sent browsing-related data to Facebook and raised privacy, consent, and controllership issues.',
        sourceIds: ['fb-cjeu-fashion-id', 'fb-columbia-safe-button'],
        imageRole: 'lesson-frame',
        confidence: 'high_confidence',
      },
    ],
    flow: [
      {
        move: 'Frame',
        title: 'Make feedback portable',
        body: [
          'The naive frame was a reaction inside Facebook. A Like could help rank or label content, but only inside the social network.',
          'The external Like Button reframed the click as web infrastructure. Publishers got a familiar feedback primitive, while Facebook connected off-site objects to its social graph.',
        ],
        sourceIds: ['fb-techcrunch-2010-launch', 'fb-ftc-complaint', 'fb-social-plugins'],
      },
      {
        move: 'List',
        title: 'Choose what the click should do',
        body: [
          'Facebook could have offered a badge, a share button, a comment widget, or a full login flow. The Like Button sat at the lightest end of that spectrum.',
          'That low-friction choice made adoption easier for publishers, but it also made data and consent questions harder because the plugin could operate across third-party pages.',
        ],
        sourceIds: ['fb-social-plugins', 'fb-cjeu-fashion-id', 'fb-columbia-safe-button'],
      },
      {
        move: 'Optimize',
        title: 'Reduce publisher integration cost',
        body: [
          'The adoption story matters because the unit of growth was the website, not only the user. Within one week, Facebook said 50,000 websites had added Like Button or related Social Plugins.',
          'The mechanism worked as a small embed with a large network behind it. That made distribution fast, while giving Facebook more off-site behavioral context.',
        ],
        sourceIds: ['fb-techcrunch-50000', 'fb-ftc-complaint', 'fb-columbia-safe-button'],
      },
      {
        move: 'Win',
        title: 'Let the web carry the network',
        body: [
          'The Like Button turned publisher pages into entry points for Facebook feedback. A site could borrow social proof, and Facebook could extend its graph beyond facebook.com.',
          'The evidence is strongest for launch timing and first-week spread. Claims about authentic preference or long-term sentiment should be careful because Like counts are not a clean measure of intent.',
        ],
        sourceIds: ['fb-techcrunch-2010-launch', 'fb-techcrunch-50000', 'fb-cjeu-fashion-id'],
      },
    ],
  },
  'buffer-fake-landing-page-mvp': {
    status: 'published',
    proofreadStatus: 'approved',
    title: 'Buffer Landing Page MVP',
    dek: 'Joel Gascoigne spent seven weeks testing whether anyone wanted a scheduling tool before writing the scheduling tool itself.',
    canonicalPath: '/autopsies/buffer/buffer-fake-landing-page-mvp',
    estimatedReadTime: '10 min read',
    sourceSummary: 'Six-source pack approved. Joel Gascoigne’s 2011 Buffer post is the primary source for the landing page sequence, 120 signups, 50 launch users, seven-week build, November 30 2010 launch, and first paying customer within four days. Later posts and interviews support the pricing-page lesson and longer company arc. The public record does not preserve the exact original landing page copy, the number of people who chose each price tier, or an internal transcript of the stop-coding decision.',
    replacementPolicy: 'If public evidence is insufficient, replace with the next topic in the queue rather than lowering the research bar.',
    backdropWord: 'VALIDATE',
    sources: [
      {
        id: 'buffer-7weeks',
        title: 'Idea to Paying Customers in 7 Weeks: How We Did It',
        publisher: 'Buffer Blog',
        url: 'https://buffer.com/resources/idea-to-paying-customers-in-7-weeks-how-we-did-it/',
        tier: 'A',
        accessedAt: '2026-05-17',
        supports: 'Primary first-person account of the three-stage landing page, the 120 signups, the seven-week build, the November 2010 launch, and the first paying customer within four days.',
      },
      {
        id: 'gascoigne-medium',
        title: 'How to successfully validate your idea with a Landing Page MVP',
        publisher: 'Medium (Joel Gascoigne)',
        url: 'https://medium.com/@joelgascoigne/how-to-successfully-validate-your-idea-with-a-landing-page-mvp-ef3c2d02dc51',
        tier: 'A',
        accessedAt: '2026-05-17',
        supports: 'Joel Gascoigne’s retrospective on validated learning, the funnel logic, and the quote about learning rather than optimizing for signup volume.',
      },
      {
        id: 'launcher-twopages',
        title: 'From $0 to Paying Customers: The Two-Page Strategy That Launched Buffer',
        publisher: 'The Launcher',
        url: 'https://thelauncher.substack.com/p/from-0-to-paying-customers-the-two',
        tier: 'B',
        accessedAt: '2026-05-17',
        supports: 'Pricing tier breakdown, first $5 payment framing, and end-of-month-one figures.',
      },
      {
        id: 'buffer-10years',
        title: 'Reflecting on 10 Years of Building Buffer',
        publisher: 'Buffer Blog',
        url: 'https://buffer.com/resources/10-years/',
        tier: 'A',
        accessedAt: '2026-05-17',
        supports: 'AngelPad, the 2016 layoffs, the 2018 investor buyout, the four-day workweek pilot, and the profitable-quarter arc.',
      },
      {
        id: 'macleod-interview',
        title: 'Buffer Founder Joel Gascoigne on Radical Transparency, Getting Off the VC Track, and Long-Term Thinking',
        publisher: 'Mark MacLeod',
        url: 'https://markmacleod.me/buffers-founder-joel-gascoigne-on-radical-transparency-getting-off-the-vc-track-and-long-term-thinking/',
        tier: 'B',
        accessedAt: '2026-05-17',
        supports: 'Gascoigne’s account of raising $4M total, buying out investors, long-term thinking, and Buffer’s $22.3M ARR figure at the time of interview.',
      },
      {
        id: 'hustle-buffer',
        title: 'Buffer: From Revenue on Day 4 to $3.5 Million a Year',
        publisher: 'The Hustle',
        url: 'https://thehustle.co/from-revenue-on-day-4-to-3-5-million-a-year-how-buffer-started',
        tier: 'B',
        accessedAt: '2026-05-17',
        supports: 'Early growth trajectory, the November 30 2010 launch date, the 4 percent paid conversion framing, and the Eric Ries influence.',
      },
    ],
    metrics: [
      { label: 'Landing page signups', value: '120 over 7 weeks', confidence: 'confirmed', sourceIds: ['buffer-7weeks', 'gascoigne-medium'] },
      { label: 'Launch-day users from the list', value: '50 of 120', confidence: 'confirmed', sourceIds: ['buffer-7weeks'] },
      { label: 'First paying customer', value: 'Within 3 to 4 days after launch', confidence: 'confirmed', sourceIds: ['buffer-7weeks', 'launcher-twopages'] },
      { label: 'End of month one', value: '100 signups and 3 paying customers', confidence: 'medium_confidence', sourceIds: ['launcher-twopages'] },
      { label: 'ARR at time of interview', value: '$22.3M ARR', confidence: 'confirmed', sourceIds: ['macleod-interview'] },
      { label: 'Lifetime VC raised', value: '$4M total, with $3.3M spent buying investors out in 2018', confidence: 'confirmed', sourceIds: ['buffer-10years', 'macleod-interview'] },
    ],
    images: createBufferImages(),
    quickRead: [
      {
        id: 'setup',
        title: 'The problem was personal',
        body: 'In late 2010 Joel Gascoigne wanted to drop tweets into a queue and have them spaced through the day. Existing tools made him pick exact times. His last product had failed because he built first and learned later.',
        sourceIds: ['buffer-7weeks', 'gascoigne-medium'],
        imageRole: 'hero',
        confidence: 'confirmed',
      },
      {
        id: 'decision',
        title: 'The page became the first product',
        body: 'Gascoigne stopped coding and built a two-page landing page instead: one page described Buffer, and the next collected email addresses from people who clicked Plans and Pricing.',
        sourceIds: ['buffer-7weeks'],
        imageRole: 'hatch-narrator',
        confidence: 'confirmed',
      },
      {
        id: 'wrong-obvious-answer',
        title: 'The tempting move was to build',
        body: 'The scheduling feature was narrow enough to code in evenings. That made building feel like progress. It also would have repeated the old mistake: weeks of work before the first real demand signal.',
        sourceIds: ['buffer-7weeks', 'gascoigne-medium'],
        imageRole: 'failure-mechanism',
        confidence: 'high_confidence',
      },
      {
        id: 'mechanism',
        title: 'Three pages tested three questions',
        body: 'The description page tested problem interest. The pricing page tested willingness to pay. The email capture created a conversation loop with the people who had crossed both gates.',
        sourceIds: ['buffer-7weeks', 'gascoigne-medium', 'launcher-twopages'],
        imageRole: 'failure-mechanism',
        confidence: 'confirmed',
      },
      {
        id: 'evidence',
        title: 'The signal was small and useful',
        body: 'The test produced 120 email signups in seven weeks. Fifty people used the product on launch day. The first $5 customer arrived within four days of launch.',
        sourceIds: ['buffer-7weeks', 'launcher-twopages'],
        imageRole: 'evidence-card',
        confidence: 'confirmed',
      },
      {
        id: 'lesson',
        title: 'The page was a telephone, not a funnel',
        body: 'Gascoigne later warned that founders often copy the landing page but miss the real mechanism. The point was not collecting emails at scale. The point was learning through conversations before the codebase existed.',
        sourceIds: ['gascoigne-medium'],
        imageRole: 'lesson-frame',
        confidence: 'confirmed',
      },
    ],
    comparison: {
      title: 'The obvious answer and what shipped instead',
      before: {
        label: 'The tempting move',
        items: [
          'Begin coding the scheduling feature and polish it until it felt ready to show people.',
          'Ask Twitter friends if they would use the idea and treat encouragement as validation.',
          'Build a free beta and wait to learn whether users came back.',
        ],
        summary: 'Treat product development as the validation and ship before learning whether anyone wanted it.',
      },
      after: {
        label: 'What shipped',
        items: [
          'A two-page site that described Buffer and collected emails from people who clicked Plans and Pricing.',
          'A later pricing page with free, $5, and $20 tiers before the email capture.',
          'Personal email conversations with almost every person who signed up.',
        ],
        summary: 'Treat the landing page as the product and let paying intent prove demand before writing the scheduling algorithm.',
      },
    },
    flow: [
      {
        move: 'Frame',
        title: 'A product idea with one old failure inside it',
        body: [
          'In October 2010, Joel Gascoigne was in Birmingham with a product idea and a scar from the previous one. He wanted a tool that would let him queue tweets and have them go out automatically through the day. The annoyance was real to him, but his last product had taught him that personal annoyance was not proof of market demand.',
          'The constraint he set was strict: no scheduling code, no database schema, no user accounts. The first thing to build was the smallest artifact that could answer whether anyone else had the problem, and whether that problem was strong enough to start a conversation.',
          'That is why the first version of Buffer was not Buffer. It was a page that asked the market a question with a button.',
        ],
        sourceIds: ['buffer-7weeks', 'gascoigne-medium'],
      },
      {
        move: 'List',
        title: 'The landing page asked questions in order',
        body: [
          'The first page described the product without screenshots or demos because none existed. It ended with one call to action: Plans and Pricing. That wording mattered because it asked visitors to behave like potential customers, not curious readers.',
          'The original second page was an email capture that said the product was not ready yet. It gave Gascoigne a list of people who had crossed the first gate, then gave him permission to email them. He did not treat those addresses as a vanity metric. He replied and asked how they handled the problem.',
          'The third page changed the test. Gascoigne inserted pricing tiers before the email capture: free, $5 per month, and $20 per month. That extra click filtered weaker interest and turned the page from a waitlist into a willingness-to-pay test.',
        ],
        sourceIds: ['buffer-7weeks', 'gascoigne-medium', 'launcher-twopages'],
      },
      {
        move: 'Optimize',
        title: 'The real mechanism was the conversation loop',
        body: [
          'The diagnostic shape was simple: describe the product, ask for the pricing click, show a price, then collect an email. Each step cost the visitor slightly more intent than the last.',
          'The important second mechanism happened after the form. Gascoigne emailed most of the people who signed up. He asked whether the problem was real, how they currently handled it, and whether Buffer would fit. That turned a fake door into a research desk.',
          'The tradeoff was credibility. The page described a product that did not exist yet. The reason it stayed honest enough is that the stopping point told users the product was not ready, and the follow-up conversation kept the learning human.',
        ],
        sourceIds: ['buffer-7weeks', 'gascoigne-medium'],
      },
      {
        move: 'Win',
        title: 'The public record supports a modest, useful signal',
        body: [
          'The landing page produced 120 signups over seven weeks. When the product launched on November 30, 2010, 50 of those people used it on day one. The first $5 payment arrived within three to four days.',
          'Those numbers are modest, and that is the point. The page did not prove that Buffer would become a large company. It proved that the problem was shared, that the pricing idea was not absurd, and that the founder had real people to build with once the code finally existed.',
          'The longer company arc should stay separate from the validation claim. Buffer later raised capital, joined AngelPad, published salaries, bought out investors, and operated independently at $22.3M ARR at the time of a 2024 interview. That does not mean the landing page caused the whole outcome. It means the first product decision bought the company a cleaner start.',
        ],
        sourceIds: ['buffer-7weeks', 'launcher-twopages', 'buffer-10years', 'macleod-interview'],
      },
    ],
    quote: {
      quote: "I wasn't optimizing for the number of signups I could get with this landing page, I was instead trying to learn as much as I possibly could.",
      attribution: 'Joel Gascoigne, Buffer Blog, 2011',
      context: 'On why the landing page worked as research, not just acquisition.',
      sourceIds: ['gascoigne-medium'],
    },
    timeline: [
      {
        date: 'Oct. 2010',
        label: 'Landing page launched',
        description: 'The two-page MVP goes live and Gascoigne tweets it to his existing audience.',
        type: 'launch',
      },
      {
        date: 'Nov. 30, 2010',
        label: 'Buffer v1 ships',
        description: 'Gascoigne launches the working product at the November Startup Sprint deadline.',
        type: 'launch',
      },
      {
        date: 'Dec. 2010',
        label: 'First paying customer',
        description: 'The first $5 payment arrives within three to four days of launch.',
        type: 'milestone',
      },
      {
        date: '2011',
        label: 'AngelPad and seed round',
        description: 'Buffer joins AngelPad and raises seed funding.',
        type: 'milestone',
      },
      {
        date: '2018',
        label: 'Investor buyout',
        description: 'Buffer spends $3.3M buying out VC investors to operate independently.',
        type: 'pivot',
      },
      {
        date: '2024',
        label: 'Calm company at scale',
        description: 'Gascoigne describes Buffer as operating at $22.3M ARR at the time of interview.',
        type: 'today',
      },
    ],
    principle: {
      principle: 'A landing page is a product when it tests the next irreversible commitment, and a conversation is faster than a codebase at finding out whether anyone wants the thing.',
      attribution: 'HackProduct autopsy lesson',
      sourceIds: ['buffer-7weeks', 'gascoigne-medium'],
    },
    sourcePackSummary: 'The strongest evidence comes from Gascoigne’s own post-launch writing and later retrospective. Public sources support the page sequence, the signup count, launch conversion from the list, early payment timing, and the later company milestones. They do not preserve the exact landing page copy or the number of people who clicked each price tier.',
  },
}

export const companyTeardownStories: FeatureAutopsy[] = [
  {
    slug: 'notion-block-architecture',
    companySlug: 'notion',
    storyType: 'company_teardown',
    title: 'The block bet',
    dek: 'A migration draft for the larger Notion story: why choosing blocks as the primitive made documents, databases, and later collaboration feel like one product.',
    queueRank: 1001,
    status: 'draft',
    proofreadStatus: 'not_started',
    canonicalPath: '/autopsies/notion/notion-block-architecture',
    estimatedReadTime: '8 min read',
    tags: ['company-teardown', 'architecture', 'productivity'],
    sourceSummary: 'Migrated from the older showcase story. It needs a fresh source pack, image manifest, and proofreading pass before public publish.',
    replacementPolicy: 'Keep as a company-level migration draft until the source pack and image QA match the feature autopsy standard.',
    sources: [],
    metrics: [],
    images: [],
    quickRead: createCompanyTeardownQuickRead({
      setup: 'Notion was not simply choosing a document editor shape. It was deciding what every piece of workspace content should be made of.',
      decision: 'The company bet on blocks as the primitive: paragraphs, tables, pages, embeds, and databases as movable units.',
      trap: 'The easier answer was rich text plus add-on features. That would have shipped faster, but it would have kept documents and databases structurally separate.',
      mechanism: 'Once content is made of blocks, the same object can be moved, embedded, referenced, filtered, or viewed in different ways.',
      evidence: 'The current draft needs a refreshed public source map before it can make strong claims about timing, usage, or internal tradeoffs.',
      lesson: 'A company-level product bet often starts as architecture. The visible feature is only the surface of the primitive underneath.',
    }),
    flow: [
      {
        move: 'Frame',
        title: 'The company-level question',
        body: [
          'The Notion story is bigger than a single feature. The product had to decide whether it was a nicer document editor or a workspace built from smaller composable parts.',
          'That question belongs at the company hub level because it explains why later feature autopsies, like slash command and databases, make sense together.',
        ],
        sourceIds: [],
      },
      {
        move: 'List',
        title: 'The tempting path',
        body: [
          'A conventional editor would have started with rich text, then attached tables, embeds, and views as separate modules.',
          'That path is easier to explain and easier to ship early. It also makes every future surface negotiate with a document model that was not built for structured work.',
        ],
        sourceIds: [],
      },
      {
        move: 'Optimize',
        title: 'The block primitive',
        body: [
          'The block model made each unit of content addressable. A paragraph, checklist, database row, or embed could become part of the same canvas.',
          'The mechanism matters because it turned future product expansion into a question of composing blocks rather than adding unrelated feature panels.',
        ],
        sourceIds: [],
      },
      {
        move: 'Win',
        title: 'Why it belongs in the hub',
        body: [
          'A company teardown should explain the operating bet that makes the smaller feature stories legible.',
          'For Notion, the hub-level story is the block bet. The feature-level stories can then study how that bet showed up in individual user moments.',
        ],
        sourceIds: [],
      },
    ],
    timeline: [
      { date: 'Migration', label: 'Older showcase story moved into the new hub model.', description: 'The story is visible as a draft company teardown while research and image QA are refreshed.', type: 'draft' },
      { date: 'Next gate', label: 'Source pack refresh', description: 'The teardown needs public sources for launch timing, founder framing, architecture claims, and measurable outcomes.', type: 'research' },
    ],
    principle: {
      principle: 'Company teardowns explain the primitive. Feature autopsies explain the user moment.',
      attribution: 'HackProduct migration note',
      sourceIds: [],
    },
    sourcePackSummary: 'This story is intentionally marked as a migration draft. It should not be treated as a published, proofread company teardown until the source pack and Hatch image set are rebuilt.',
  },
  {
    slug: 'airbnb-decoded',
    companySlug: 'airbnb',
    storyType: 'company_teardown',
    title: 'Airbnb Decoded',
    dek: 'A migration draft for the larger Airbnb marketplace story: how trust, supply, demand, and booking confidence compound across the company journey.',
    queueRank: 1002,
    status: 'draft',
    proofreadStatus: 'not_started',
    canonicalPath: '/autopsies/airbnb/airbnb-decoded',
    estimatedReadTime: '20 min read',
    tags: ['company-teardown', 'marketplace', 'trust'],
    sourceSummary: 'Migrated from the older showcase story. It needs updated sourcing, claim boundaries, and a new image system before public publish.',
    replacementPolicy: 'Keep as a company-level migration draft until the old AARRR-style narrative is rewritten into the new editorial reader.',
    sources: [],
    metrics: [],
    images: [],
    quickRead: createCompanyTeardownQuickRead({
      setup: 'Airbnb is not one feature story. It is a marketplace story about getting strangers to trust inventory, hosts, payment, and each other.',
      decision: 'The company-level lens follows the full loop: discovery, listing quality, booking confidence, review trust, and repeat supply.',
      trap: 'A shallow teardown would reduce Airbnb to growth hacks. That misses the harder product work of making a risky transaction feel inspectable.',
      mechanism: 'The marketplace compounds when every completed stay creates better supply, better trust signals, and more confidence for the next booking.',
      evidence: 'The current draft needs refreshed public sources before it can carry traffic, conversion, supply, or cost claims.',
      lesson: 'Marketplace teardowns should separate acquisition tricks from the trust machinery that lets demand and supply keep returning.',
    }),
    flow: [
      {
        move: 'Frame',
        title: 'The company-level question',
        body: [
          'Airbnb asks a broader question than any one feature can hold: what has to be true before a traveler trusts a stranger enough to book a stay?',
          'That makes it a hub-level teardown. Individual stories like the Craigslist distribution move can sit underneath it as narrower feature or tactic autopsies.',
        ],
        sourceIds: [],
      },
      {
        move: 'List',
        title: 'The tempting reduction',
        body: [
          'The old way to tell Airbnb is to focus on one growth tactic and call that the company story.',
          'That is too thin. Distribution mattered, but the company also had to improve listing quality, payments, reviews, host trust, guest confidence, and repeat use.',
        ],
        sourceIds: [],
      },
      {
        move: 'Optimize',
        title: 'The trust loop',
        body: [
          'A marketplace becomes stronger when the next user sees better evidence than the previous user did.',
          'Photos, reviews, host profiles, availability, price clarity, and post-stay feedback all reduce uncertainty in different parts of the same loop.',
        ],
        sourceIds: [],
      },
      {
        move: 'Win',
        title: 'Why it belongs in the hub',
        body: [
          'The company teardown should hold the system story. Feature autopsies can then zoom into distribution, reviews, photos, payments, or host onboarding without pretending any one move explains the whole company.',
        ],
        sourceIds: [],
      },
    ],
    timeline: [
      { date: 'Migration', label: 'Older showcase story moved into the new hub model.', description: 'The story is visible as a draft company teardown while the editorial treatment is rebuilt.', type: 'draft' },
      { date: 'Next gate', label: 'Trust-loop source pack', description: 'The teardown needs sources for marketplace mechanics, early launch history, trust signals, and measurable outcomes.', type: 'research' },
    ],
    principle: {
      principle: 'Do not make the growth tactic carry the whole company story.',
      attribution: 'HackProduct migration note',
      sourceIds: [],
    },
    sourcePackSummary: 'This story is intentionally marked as a migration draft. It should not be treated as a published, proofread company teardown until the source pack, claim map, and Hatch image set are rebuilt.',
  },
]

const baseFeatureAutopsies: FeatureAutopsy[] = FIRST_50_TOPICS.map(
  ([companySlug, , slug, title, dek], index) => {
    const base: FeatureAutopsy = {
      slug,
      companySlug,
      storyType: 'feature_autopsy',
      title,
      dek,
      queueRank: index + 1,
      status: 'draft',
      proofreadStatus: 'not_started',
      canonicalPath: `/autopsies/${companySlug}/${slug}`,
      estimatedReadTime: '8 min read',
      tags: ['feature-autopsy', 'editorial', inferIndustry(companySlug)],
      sourceSummary: 'Requires at least five credible sources before drafting.',
      replacementPolicy: 'If public evidence is insufficient, replace with the next topic in the queue.',
      featured: index === 0,
      sources: [],
      metrics: [],
      images: [],
      quickRead: createDraftQuickRead(title, dek),
      flow: createDraftFlow(),
    }
    return { ...base, ...(PILOT_STORY_OVERRIDES[slug] ?? {}) }
  }
)

export const featureAutopsies: FeatureAutopsy[] = mergeFeatureAutopsies([
  ...baseFeatureAutopsies,
  ...generatedDraftFeatureAutopsies,
]).map(withAutopsyStorageImages)

export const autopsyStories: FeatureAutopsy[] = [
  ...companyTeardownStories,
  ...featureAutopsies,
].map(withAutopsyStorageImages)

function mergeCompanyHubs(hubs: CompanyHub[]) {
  const bySlug = new Map<string, CompanyHub>()
  for (const hub of hubs) {
    bySlug.set(hub.slug, {
      ...(bySlug.get(hub.slug) ?? {}),
      ...hub,
    })
  }
  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name))
}

function mergeFeatureAutopsies(stories: FeatureAutopsy[]) {
  const bySlug = new Map<string, FeatureAutopsy>()
  for (const story of stories) {
    bySlug.set(story.slug, {
      ...(bySlug.get(story.slug) ?? {}),
      ...story,
    })
  }
  return [...bySlug.values()].sort((a, b) => a.queueRank - b.queueRank)
}

function inferIndustry(slug: string): string {
  if (['stripe', 'figma', 'tailwind', 'prettier', 'vite', 'cursor', 'linear'].includes(slug)) return 'Developer Tools'
  if (['airbnb', 'uber-eats', 'doordash'].includes(slug)) return 'Marketplace'
  if (['netflix', 'youtube', 'spotify', 'instagram', 'tiktok'].includes(slug)) return 'Consumer Media'
  if (['slack', 'notion', 'calendly', 'superhuman', 'gamma'].includes(slug)) return 'Productivity'
  if (['google', 'amazon', 'apple', 'facebook'].includes(slug)) return 'Platform'
  return 'Consumer Product'
}

function inferAccent(slug: string): string {
  const accents: Record<string, string> = {
    spotify: '#1db954',
    google: '#4285f4',
    facebook: '#1877f2',
    whatsapp: '#25d366',
    instagram: '#c13584',
    stripe: '#635bff',
    airbnb: '#ff5a5f',
    notion: '#191919',
    slack: '#611f69',
    netflix: '#e50914',
    amazon: '#ff9900',
    apple: '#60646c',
    linear: '#5e6ad2',
  }
  return accents[slug] ?? '#4a7c59'
}

function createCompanyTeardownQuickRead(cards: {
  setup: string
  decision: string
  trap: string
  mechanism: string
  evidence: string
  lesson: string
}): QuickReadCard[] {
  return [
    {
      id: 'setup',
      title: 'The company setup',
      body: cards.setup,
      sourceIds: [],
      imageRole: 'hero',
      confidence: 'unverified',
    },
    {
      id: 'decision',
      title: 'The operating bet',
      body: cards.decision,
      sourceIds: [],
      imageRole: 'hatch-narrator',
      confidence: 'unverified',
    },
    {
      id: 'wrong-obvious-answer',
      title: 'The easy misread',
      body: cards.trap,
      sourceIds: [],
      imageRole: 'failure-mechanism',
      confidence: 'unverified',
    },
    {
      id: 'mechanism',
      title: 'The system mechanic',
      body: cards.mechanism,
      sourceIds: [],
      imageRole: 'failure-mechanism',
      confidence: 'unverified',
    },
    {
      id: 'evidence',
      title: 'The research gap',
      body: cards.evidence,
      sourceIds: [],
      imageRole: 'evidence-card',
      confidence: 'unverified',
    },
    {
      id: 'lesson',
      title: 'The hub lesson',
      body: cards.lesson,
      sourceIds: [],
      imageRole: 'lesson-frame',
      confidence: 'unverified',
    },
  ]
}

function createDraftQuickRead(title: string, dek: string): QuickReadCard[] {
  return [
    {
      id: 'setup',
      title: 'The setup',
      body: `${title} starts with a specific product habit that needs public evidence before the full story is written.`,
      sourceIds: [],
      imageRole: 'hero',
      confidence: 'unverified',
    },
    {
      id: 'decision',
      title: 'The decision',
      body: dek,
      sourceIds: [],
      imageRole: 'hatch-narrator',
      confidence: 'unverified',
    },
    {
      id: 'wrong-obvious-answer',
      title: 'The wrong obvious answer',
      body: 'The research pass must identify the tempting generic solution and why it did not match the real frame.',
      sourceIds: [],
      imageRole: 'failure-mechanism',
      confidence: 'unverified',
    },
    {
      id: 'mechanism',
      title: 'The mechanism',
      body: 'The mechanism card will explain the behavior change, constraint, or distribution path supported by sources.',
      sourceIds: [],
      imageRole: 'failure-mechanism',
      confidence: 'unverified',
    },
    {
      id: 'evidence',
      title: 'The evidence',
      body: 'No metric or quote is shown here until the source pack and confidence label pass review.',
      sourceIds: [],
      imageRole: 'evidence-card',
      confidence: 'unverified',
    },
    {
      id: 'lesson',
      title: 'The lesson',
      body: 'The final card will turn the researched story into one product judgment pattern a reader can reuse.',
      sourceIds: [],
      imageRole: 'lesson-frame',
      confidence: 'unverified',
    },
  ]
}

function createDraftFlow() {
  return [
    {
      move: 'Frame' as const,
      title: 'Research the starting frame',
      body: ['Identify the user problem, the accepted approach, and the sharper frame supported by sources.'],
      sourceIds: [],
    },
    {
      move: 'List' as const,
      title: 'Map the real alternatives',
      body: ['List plausible options the team could have chosen. Remove any option that cannot be argued honestly.'],
      sourceIds: [],
    },
    {
      move: 'Optimize' as const,
      title: 'Explain the shipped mechanism',
      body: ['Show why the chosen mechanism fit the frame, including tradeoffs, constraints, and measurable signals.'],
      sourceIds: [],
    },
    {
      move: 'Win' as const,
      title: 'Trace adoption or distribution',
      body: ['Explain how the feature reached users or changed behavior, without claiming causality beyond the evidence.'],
      sourceIds: [],
    },
  ]
}

function createPilotImages(slug: string, title: string, theme: string) {
  const root = `/images/autopsies/${slug}/final`
  const extension = slug === 'gmail-undo-send' ? 'webp' : 'svg'
  return [
    {
      role: 'hero' as const,
      src: `${root}/hero.${extension}`,
      alt: `${title} hero illustration showing ${theme}.`,
      caption: `Hatch frames ${title} as ${theme}.`,
      width: 2400,
      height: 1350,
      watermark: true,
      qaStatus: 'approved' as const,
    },
    {
      role: 'hatch-narrator' as const,
      src: `${root}/hatch-narrator.${extension}`,
      alt: `Hatch narrator illustration for ${title}.`,
      caption: `Hatch points to the key product decision in ${title}.`,
      width: 1600,
      height: 1600,
      watermark: true,
      qaStatus: 'approved' as const,
    },
    {
      role: 'failure-mechanism' as const,
      src: `${root}/failure-mechanism.${extension}`,
      alt: `${title} mechanism diagram using abstract product shapes.`,
      caption: `The mechanism visual shows how the decision changed user behavior.`,
      width: 1800,
      height: 1200,
      watermark: true,
      qaStatus: 'approved' as const,
    },
    {
      role: 'evidence-card' as const,
      src: `${root}/evidence-card.${extension}`,
      alt: `${title} evidence card with source-backed product signal.`,
      caption: `The evidence card holds one source-backed signal for ${title}.`,
      width: 1600,
      height: 1000,
      watermark: true,
      qaStatus: 'approved' as const,
    },
    {
      role: 'lesson-frame' as const,
      src: `${root}/lesson-frame.${extension}`,
      alt: `${title} lesson frame with Hatch explaining the reusable product move.`,
      caption: `The lesson frame converts ${title} into a reusable product judgment pattern.`,
      width: 1800,
      height: 1200,
      watermark: true,
      qaStatus: 'approved' as const,
    },
    {
      role: 'thumbnail' as const,
      src: `${root}/thumbnail.${extension}`,
      alt: `${title} thumbnail illustration.`,
      caption: `The thumbnail keeps ${title} recognizable in the autopsy index.`,
      width: 1200,
      height: 900,
      watermark: true,
      qaStatus: 'approved' as const,
    },
    {
      role: 'social-cover' as const,
      src: `${root}/social-cover.${extension}`,
      alt: `${title} social cover illustration.`,
      caption: `The social cover is watermarked for public sharing without implying endorsement.`,
      width: 2400,
      height: 1260,
      watermark: true,
      qaStatus: 'approved' as const,
    },
  ]
}

function createBufferImages() {
  const root = '/images/autopsies/buffer-fake-landing-page-mvp/final'
  return [
    {
      role: 'hero' as const,
      src: `${root}/hero.webp`,
      alt: 'Three page-shaped panels show a product description, a pricing test, and an email capture while Hatch points to the pricing step.',
      caption: 'Three pages. No scheduling code. One demand question at a time.',
      width: 2400,
      height: 1350,
      watermark: true,
      qaStatus: 'approved' as const,
    },
    {
      role: 'hatch-narrator' as const,
      src: `${root}/hatch-narrator.webp`,
      alt: 'Hatch stands beside a small desk with a laptop showing a code editor next to a landing page wireframe.',
      caption: 'The first decision was to stop coding and make the question visible.',
      width: 1600,
      height: 1600,
      watermark: true,
      qaStatus: 'approved' as const,
    },
    {
      role: 'failure-mechanism' as const,
      src: `${root}/failure-mechanism.webp`,
      alt: 'A four-stage diagram runs from tweet to product page to pricing tiers to email capture, with a conversation loop below.',
      caption: 'The mechanism filtered curiosity into pricing intent, then turned that intent into conversations.',
      width: 1800,
      height: 1200,
      watermark: true,
      qaStatus: 'approved' as const,
    },
    {
      role: 'evidence-card' as const,
      src: `${root}/evidence-card.webp`,
      alt: 'A validation chart shows 120 signups, 50 launch-day users, and a first five-dollar payment within four days.',
      caption: 'The public evidence is modest by design: 120 signups, 50 launch-day users, and a first paid customer.',
      width: 1600,
      height: 1000,
      watermark: true,
      qaStatus: 'approved' as const,
    },
    {
      role: 'lesson-frame' as const,
      src: `${root}/lesson-frame.webp`,
      alt: 'Hatch coaches beside a split illustration comparing a code editor with a landing page and conversation loop.',
      caption: 'The lesson frame keeps the reusable move separate from the company myth.',
      width: 1800,
      height: 1200,
      watermark: true,
      qaStatus: 'approved' as const,
    },
    {
      role: 'thumbnail' as const,
      src: `${root}/thumbnail.webp`,
      alt: 'A compact landing page card with a pricing chip and submit button represents the Buffer validation story.',
      caption: 'The thumbnail keeps the Buffer autopsy recognizable in the library.',
      width: 1200,
      height: 900,
      watermark: true,
      qaStatus: 'approved' as const,
    },
    {
      role: 'social-cover' as const,
      src: `${root}/social-cover.webp`,
      alt: 'Three sequential landing page shapes connected by arrows show validation without code.',
      caption: 'The social cover frames Buffer as a demand test, not a company endorsement.',
      width: 2400,
      height: 1260,
      watermark: true,
      qaStatus: 'approved' as const,
    },
  ]
}
