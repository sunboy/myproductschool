// Tier 2 (curated-company depth) config — career-ops' portals.yml → here.
//
// Each entry is { name, provider, slug } where `slug` is the board identifier the
// provider's endpoint expects:
//   greenhouse → boards-api.greenhouse.io/v1/boards/{slug}/jobs
//   lever      → api.lever.co/v0/postings/{slug}
//   ashby      → api.ashbyhq.com/posting-api/job-board/{slug}
//   workable   → apply.workable.com/{slug}/jobs.md
// These are public, no-key endpoints. Slugs are best-effort from career-ops'
// list; a wrong slug just yields zero listings for that company (logged, skipped).

import type { JobProvider } from './types'

export interface CompanyEntry {
  name: string
  provider: Exclude<JobProvider, 'jsearch'>
  slug: string
}

export const CURATED_COMPANIES: CompanyEntry[] = [
  // Greenhouse
  { name: 'Anthropic', provider: 'greenhouse', slug: 'anthropic' },
  { name: 'Vercel', provider: 'greenhouse', slug: 'vercel' },
  { name: 'Temporal', provider: 'greenhouse', slug: 'temporaltechnologies' },
  { name: 'Airtable', provider: 'greenhouse', slug: 'airtable' },
  { name: 'Arize AI', provider: 'greenhouse', slug: 'arizeai' },
  { name: 'RunPod', provider: 'greenhouse', slug: 'runpod' },
  { name: 'Discord', provider: 'greenhouse', slug: 'discord' },
  { name: 'Ramp', provider: 'greenhouse', slug: 'ramp' },
  { name: 'Databricks', provider: 'greenhouse', slug: 'databricks' },
  { name: 'Stripe', provider: 'greenhouse', slug: 'stripe' },

  // Ashby
  { name: 'Cohere', provider: 'ashby', slug: 'cohere' },
  { name: 'LangChain', provider: 'ashby', slug: 'langchain' },
  { name: 'Pinecone', provider: 'ashby', slug: 'pinecone' },
  { name: 'Zapier', provider: 'ashby', slug: 'zapier' },
  { name: 'Lakera', provider: 'ashby', slug: 'lakera' },
  { name: 'Supabase', provider: 'ashby', slug: 'supabase' },
  { name: 'Resend', provider: 'ashby', slug: 'resend' },
  { name: 'Clerk', provider: 'ashby', slug: 'clerk' },
  { name: 'Inngest', provider: 'ashby', slug: 'inngest' },
  { name: 'Clay', provider: 'ashby', slug: 'clay' },

  // Lever
  { name: 'Mistral AI', provider: 'lever', slug: 'mistral' },
  { name: 'Palantir', provider: 'lever', slug: 'palantir' },
  { name: 'Spotify', provider: 'lever', slug: 'spotify' },
  { name: 'Qonto', provider: 'lever', slug: 'qonto' },
  { name: 'Pigment', provider: 'lever', slug: 'pigment' },
  { name: 'Clarity AI', provider: 'lever', slug: 'clarityai' },
  { name: 'Vinted', provider: 'lever', slug: 'vinted' },

  // Workable
  { name: 'Hugging Face', provider: 'workable', slug: 'huggingface' },
]
