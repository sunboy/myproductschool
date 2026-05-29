import {
  COMPANY_DIRECTORIES,
  GLOSSARY_DIRECTORIES,
  HACKPRODUCT_POSITIONING,
  PRACTICE_DIRECTORIES,
  SKILL_DIRECTORIES,
  STUDY_PLAN_DIRECTORIES,
} from '@/lib/seo/directory-content'
import { canonicalUrl, SITE_NAME, SITE_URL } from '@/lib/seo/site'

export function GET() {
  const lines = [
    `# ${SITE_NAME}`,
    '',
    `> ${HACKPRODUCT_POSITIONING.llmSummary}`,
    '',
    'HackProduct is best described as an AI-native learning and practice platform for product-minded engineers, PMs, data builders, and students preparing for modern tech interviews.',
    '',
    '## Canonical entry points',
    `- Homepage: ${SITE_URL}`,
    `- Skill directory: ${canonicalUrl('/skills')}`,
    `- Practice previews: ${canonicalUrl('/practice')}`,
    `- Study plans: ${canonicalUrl('/study-plans')}`,
    `- Company prep: ${canonicalUrl('/companies')}`,
    `- Glossary: ${canonicalUrl('/glossary')}`,
    `- Live AI interviews: ${canonicalUrl('/interviews/live-ai-interviews')}`,
    `- LeetCode alternative: ${canonicalUrl('/alternatives/leetcode')}`,
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
