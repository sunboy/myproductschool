import { NextRequest, NextResponse } from 'next/server'
import { getChallengeById } from '@/lib/data/challenges'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const challenge = await getChallengeById(id)
  if (!challenge) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(challenge)
}
