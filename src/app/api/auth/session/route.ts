import { NextResponse } from 'next/server'
import { getCookie } from '@/lib/cookies'

export async function GET() {
  try {
    const session = await getCookie('session')

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = JSON.parse(session.value)

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 