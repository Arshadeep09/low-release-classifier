import { NextResponse } from 'next/server'

export async function POST() {
  // In a real app, you would update the active SOP version in your database here
  return NextResponse.json({ success: true })
} 