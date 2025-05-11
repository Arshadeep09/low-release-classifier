import { NextResponse } from 'next/server'
import { deleteCookie } from '@/lib/cookies'

export async function POST() {
  try {
    // Clear session cookie
    await deleteCookie('session')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
} 