// lib/judge0/languageMap.ts — server-side only
// Language IDs verified against Judge0 CE on RapidAPI (GET /languages).
// Verify values before adding new languages.
export const JUDGE0_LANGUAGE_IDS = {
  python: 109,      // Python (3.13.2)
  javascript: 102,  // JavaScript (Node.js 22.08.0)
  java: 62,         // Java (OpenJDK 13.0.1)
  cpp: 54,          // C++ (GCC 9.2.0)
  go: 60,           // Go (1.13.5)
} as const

export type SupportedJudge0Language = keyof typeof JUDGE0_LANGUAGE_IDS
