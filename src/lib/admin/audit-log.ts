import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

type JsonObject = Record<string, unknown>

interface AdminAuditInput {
  adminId?: string | null
  action: string
  targetType: string
  targetId?: string | null
  before?: JsonObject | null
  after?: JsonObject | null
}

export async function logAdminAction(admin: SupabaseClient, input: AdminAuditInput) {
  const { error } = await admin.from('admin_action_log').insert({
    admin_id: input.adminId ?? null,
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId ?? null,
    before: input.before ?? null,
    after: input.after ?? null,
  })

  if (error) throw new Error(`Could not write admin audit log: ${error.message}`)
}
