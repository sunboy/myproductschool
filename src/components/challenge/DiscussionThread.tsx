'use client'

import { ChallengeDiscussion } from '@/lib/types'

interface Props {
  discussion: ChallengeDiscussion
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getInitials(username: string): string {
  const parts = username.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return username.slice(0, 2).toUpperCase()
}

export function DiscussionThread({ discussion, isOP = false }: Props & { isOP?: boolean }) {
  const initials = getInitials(discussion.username ?? 'User')

  // Main thread opener style (OP)
  if (isOP) {
    return (
      <div className="bg-surface-container-lowest rounded-lg p-6 editorial-shadow ghost-border border-l-4 border-primary">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
            <span className="text-on-primary-container font-bold text-sm">{initials}</span>
          </div>
          <div className="flex-grow">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-on-surface">{discussion.username ?? 'Anonymous'}</span>
              <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                OP
              </span>
              <span className="text-xs text-outline">• {relativeTime(discussion.created_at)}</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-secondary-container text-on-secondary-container text-xs px-2 py-0.5 rounded-md font-medium">
                Senior PM @ Google
              </span>
            </div>
            <p className="text-on-surface leading-relaxed mb-4">{discussion.content}</p>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-sm font-bold border border-primary/20 hover:bg-primary-container transition-colors">
                <span
                  className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  thumb_up
                </span>
                {discussion.upvote_count}
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-highest text-on-surface-variant text-sm font-medium hover:bg-surface-dim transition-colors">
                <span className="material-symbols-outlined text-sm">chat_bubble</span>
                {discussion.reply_count ?? 0} Comments
              </button>
              <button className="material-symbols-outlined p-1.5 text-outline hover:bg-surface-dim rounded-full transition-colors">
                share
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Expert pick reply style
  if (discussion.is_expert_pick) {
    return (
      <div className="bg-surface-container-lowest rounded-lg p-6 editorial-shadow ghost-border border-l-4 border-tertiary">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center flex-shrink-0">
            <span className="text-on-tertiary-container font-bold text-sm">{initials}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-on-surface text-sm">{discussion.username ?? 'Anonymous'}</span>
              <span className="bg-tertiary-container text-on-tertiary-container text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">
                Expert Pick
              </span>
              <span className="text-xs text-outline">• {relativeTime(discussion.created_at)}</span>
            </div>
            <span className="text-xs text-tertiary font-semibold">Staff Designer @ HackProduct</span>
          </div>
        </div>
        <p className="text-on-surface-variant text-sm leading-relaxed mb-4">{discussion.content}</p>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1.5 text-xs font-bold text-primary">
            <span className="material-symbols-outlined text-sm">expand_less</span>
            UPVOTE ({discussion.upvote_count})
          </button>
          <button className="text-xs font-semibold text-outline hover:text-primary transition-colors">
            REPLY
          </button>
        </div>
      </div>
    )
  }

  // Regular reply style
  return (
    <div className="bg-surface-container-lowest rounded-lg p-6 editorial-shadow ghost-border">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
          <span className="text-on-primary-container font-bold text-sm">{initials}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-on-surface text-sm">{discussion.username ?? 'Anonymous'}</span>
            <span className="text-xs text-outline">• {relativeTime(discussion.created_at)}</span>
          </div>
          <span className="text-xs text-on-surface-variant">Design Engineer</span>
        </div>
      </div>
      <p className="text-on-surface-variant text-sm leading-relaxed mb-4">{discussion.content}</p>
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-1.5 text-xs font-bold text-outline hover:text-primary">
          <span className="material-symbols-outlined text-sm">expand_less</span>
          UPVOTE ({discussion.upvote_count})
        </button>
        <button className="text-xs font-semibold text-outline hover:text-primary transition-colors">
          REPLY
        </button>
      </div>
    </div>
  )
}

// Sub-reply component for threaded replies
export function SubReply({ username, content, time }: { username: string; content: string; time: string }) {
  return (
    <div className="ml-8 border-l border-surface-container-highest pl-4 mt-2">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center">
          <span className="material-symbols-outlined text-outline text-sm">person</span>
        </div>
        <div className="flex-grow">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-on-surface text-xs">{username}</span>
            <span className="text-[10px] text-outline">• {time}</span>
          </div>
          <p className="text-on-surface-variant text-xs leading-normal">{content}</p>
        </div>
      </div>
    </div>
  )
}
