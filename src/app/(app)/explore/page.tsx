import { redirect } from 'next/navigation'

// The Explore index (discipline tabs + filters + browse shelves) was retired:
// it only duplicated content already reachable directly (Study Plans,
// Autopsies via the sidebar; discipline/company/difficulty filters and the
// Real Interviews / Trending views via Practice's own filters). /explore/plans,
// /explore/autopsies, and /explore/modules are unaffected — only this index
// page is gone.
export default function ExplorePage() {
  redirect('/challenges')
}
