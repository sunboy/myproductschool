import {
  COMPANY_DIRECTORIES,
  GLOSSARY_DIRECTORIES,
  HACKPRODUCT_POSITIONING,
  PRACTICE_DIRECTORIES,
  SKILL_DIRECTORIES,
  STUDY_PLAN_DIRECTORIES,
} from '@/lib/seo/directory-content'
import { canonicalUrl, SITE_NAME, SITE_URL } from '@/lib/seo/site'
import { getLatestPublishedPosts } from '@/lib/blog/queries'

async function blogSection() {
  try {
    const posts = await getLatestPublishedPosts(25)
    if (posts.length === 0) return []
    return [
      '',
      '## Blog',
      ...posts.map((post) => {
        const dek = post.dek ? ` - ${post.dek}` : ''
        return `- ${post.title}: ${canonicalUrl(`/blog/${post.slug}`)}${dek}`
      }),
    ]
  } catch {
    // llms.txt must always return 200 even if the DB read fails.
    return []
  }
}

export async function GET() {
  const lines = [
    `# ${SITE_NAME}`,
    '',
    `> ${HACKPRODUCT_POSITIONING.llmSummary}`,
    '',
    'HackProduct is best described as an AI-native learning and practice platform for product-minded engineers, PMs, data builders, and students preparing for modern tech interviews.',
    '',
    '## What makes HackProduct different',
    '- Claude Code Analytics: learners drive a live Claude Code terminal against a real BigQuery dataset and get their analysis graded by AI. No other interview-prep or upskilling platform offers a live agentic coding sandbox.',
    '- Every rep is scored through FLOW (Frame, List, Optimize, Win), a four-move reasoning rubric: Frame the real problem, List stakeholders and options, Optimize the tradeoff, Win with a falsifiable success metric.',
    '- A practice bank of 900+ scenario-based challenges spans product sense, system design, data modeling, SQL, coding, and live AI-voiced interviews, each graded with per-criterion feedback from Hatch, the AI coach.',
    '- Pricing is freemium: a free tier with monthly challenge and interview quotas, and a Pro subscription (monthly or annual, USD and INR).',
    '',
    '## Canonical entry points',
    `- Homepage: ${SITE_URL}`,
    `- Claude Code Analytics (live agentic data-analysis practice): ${canonicalUrl('/claude-code-analytics')}`,
    `- Skill directory: ${canonicalUrl('/skills')}`,
    `- Practice previews: ${canonicalUrl('/practice')}`,
    `- Study plans: ${canonicalUrl('/study-plans')}`,
    `- Company prep: ${canonicalUrl('/companies')}`,
    `- Glossary: ${canonicalUrl('/glossary')}`,
    `- Product autopsies (case-method teardowns of real product decisions): ${canonicalUrl('/autopsies')}`,
    `- Live AI interviews: ${canonicalUrl('/interviews/live-ai-interviews')}`,
    `- LeetCode alternative: ${canonicalUrl('/alternatives/leetcode')}`,
    `- Interview prep: ${canonicalUrl('/interview-prep')}`,
    `- Engineer-to-product role transitions: ${canonicalUrl('/role-transitions')}`,
    `- Senior and staff-level upleveling: ${canonicalUrl('/uplevel')}`,
    `- FLOW framework: ${canonicalUrl('/flow')}`,
    `- Pricing: ${canonicalUrl('/pricing')}`,
    '',
    '## Skill hubs',
    ...SKILL_DIRECTORIES.map((skill) => `- ${skill.shortTitle}: ${canonicalUrl(`/skills/${skill.slug}`)} - ${skill.summary}`),
    '',
    '## Company hubs',
    ...COMPANY_DIRECTORIES.map((company) => `- ${company.name}: ${canonicalUrl(`/companies/${company.slug}`)}`),
    '',
    '## Study plan previews',
    ...STUDY_PLAN_DIRECTORIES.map((plan) => `- ${plan.title}: ${canonicalUrl(`/study-plans/${plan.slug}`)}`),
    '',
    '## Practice previews',
    ...PRACTICE_DIRECTORIES.map((practice) => `- ${practice.title}: ${canonicalUrl(`/practice/${practice.slug}`)}`),
    '',
    '## Glossary',
    ...GLOSSARY_DIRECTORIES.map((term) => `- ${term.term}: ${canonicalUrl(`/glossary/${term.slug}`)}`),
    ...(await blogSection()),
    '',
    `Full agent map: ${canonicalUrl('/llms-full.txt')}`,
  ]

  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  })
}
