import { createClient } from '@/lib/supabase/server'
import { getUserNotes } from '@/lib/data/dashboard'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { NotesGrid } from '@/components/notes/NotesGrid'

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const notes = user ? await getUserNotes(user.id) : []

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <HatchGlyph size={40} state="listening" className="flex-shrink-0" />
        <div>
          <h1 className="font-headline font-bold text-2xl text-on-surface">Notes</h1>
          <p className="text-sm text-on-surface-variant">Your thoughts, Hatch&apos;s memory.</p>
        </div>
      </div>

      <NotesGrid initialNotes={notes} />
    </div>
  )
}
