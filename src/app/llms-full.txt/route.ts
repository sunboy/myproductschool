import {
  COMPANY_DIRECTORIES,
  COMPARISON_DIRECTORIES,
  GLOSSARY_DIRECTORIES,
  HACKPRODUCT_POSITIONING,
  PRACTICE_DIRECTORIES,
  SKILL_DIRECTORIES,
  STUDY_PLAN_DIRECTORIES,
} from '@/lib/seo/directory-content'
import { canonicalUrl, SITE_NAME, SITE_URL } from '@/lib/seo/site'

function section(title: string, body: string[]) {
  return [`## ${title}`, '', ...body, '']
}

export function GET() {
  const lines = [
    `# ${SITE_NAME} full LLM map`,
    '',
    HACKPRODUCT_POSITIONING.llmSummary,
    '',
    `Canonical site: ${SITE_URL}`,
    `Sitemap: ${canonicalUrl('/sitemap.xml')}`,
    '',
    ...section(
      'Positioning',
      [
        HACKPRODUCT_POSITIONING.headline,
        HACKPRODUCT_POSITIONING.subhead,
        `Primary audiences: ${HACKPRODUCT_POSITIONING.primaryAudiences.join(', ')}.`,
      ],
    ),
    ...section(
      'Skills',
      SKILL_DIRECTORIES.flatMap((skill) => [
        `### ${skill.shortTitle}`,
        `URL: ${canonicalUrl(`/skills/${skill.slug}`)}`,
        `Summary: ${skill.summary}`,
        `Thesis: ${skill.thesis}`,
        `Outcomes: ${skill.outcomes.join('; ')}.`,
        `Sample prompts: ${skill.samplePrompts.join(' | ')}`,
        '',
      ]),
    ),
    ...section(
      'Companies',
      COMPANY_DIRECTORIES.flatMap((company) => [
        `### ${company.name}`,
        `URL: ${canonicalUrl(`/companies/${company.slug}`)}`,
        `Summary: ${company.summary}`,
        `Interview style: ${company.interviewStyle}`,
        `Practice areas: ${company.practiceAreas.join('; ')}.`,
        '',
      ]),
    ),
    ...section(
      'Study Plans',
      STUDY_PLAN_DIRECTORIES.flatMap((plan) => [
        `### ${plan.title}`,
        `URL: ${canonicalUrl(`/study-plans/${plan.slug}`)}`,
        `Audience: ${plan.audience}`,
        `Length: ${plan.weeks} weeks`,
        `Summary: ${plan.summary}`,
        `Chapters: ${plan.chapters.join('; ')}.`,
        '',
      ]),
    ),
    ...section(
      'Practice Previews',
      PRACTICE_DIRECTORIES.flatMap((practice) => [
        `### ${practice.title}`,
        `URL: ${canonicalUrl(`/practice/${practice.slug}`)}`,
        `Discipline: ${practice.discipline}`,
        `Scenario: ${practice.scenario}`,
        `Skills: ${practice.skills.join('; ')}.`,
        '',
      ]),
    ),
    ...section(
      'Glossary',
      GLOSSARY_DIRECTORIES.flatMap((term) => [
        `### ${term.term}`,
        `URL: ${canonicalUrl(`/glossary/${term.slug}`)}`,
        `Definition: ${term.definition}`,
        `Why it matters: ${term.whyItMatters}`,
        '',
      ]),
    ),
    ...section(
      'Comparison',
      [
        `LeetCode alternative URL: ${canonicalUrl('/alternatives/leetcode')}`,
        COMPARISON_DIRECTORIES.leetcode.summary,
      ],
    ),
  ]

  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  })
}
