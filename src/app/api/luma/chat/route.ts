import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { LUMA_CHAT_SYSTEM_PROMPT } from '@/lib/luma/system-prompt'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MOCK_REPLIES = [
  "That's an interesting framing. Can you tell me more about *why* users would behave that way — what's driving their motivation here?",
  "Good instinct. How would you validate that hypothesis before committing engineering resources to it?",
  "You mentioned metrics — what would tell you this feature is working *well enough* to ship more?",
  "Walk me through the trade-offs in your top proposal. What are you giving up by going in that direction?",
  "Interesting. How does this change if the user is a power user vs someone brand new to the product?",
]

interface Message {
  role: 'user' | 'luma'
  content: string
}

export async function POST(req: NextRequest) {
  const { challengeId, challengePrompt, message, history } = await req.json()

  if (!message?.trim()) {
    return NextResponse.json({ reply: null })
  }

  if (process.env.USE_MOCK_DATA === 'true' || !process.env.ANTHROPIC_API_KEY) {
    const reply = MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)]
    return NextResponse.json({ reply })
  }

  try {
    // Build message history
    const messages: Anthropic.MessageParam[] = []

    // Add challenge context as first Luma message
    if (challengePrompt) {
      messages.push({
        role: 'assistant',
        content: challengePrompt,
      })
    }

    // Add conversation history
    if (history?.length) {
      for (const msg of history as Message[]) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })
      }
    }

    // Add current user message
    messages.push({ role: 'user', content: message })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: LUMA_CHAT_SYSTEM_PROMPT,
      messages,
    })

    const content = response.content[0]
    const reply = content.type === 'text' ? content.text.trim() : null
    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Luma chat error:', error)
    const fallback = MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)]
    return NextResponse.json({ reply: fallback })
  }
}
