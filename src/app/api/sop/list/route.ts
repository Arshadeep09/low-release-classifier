import { NextResponse } from 'next/server'
import { readdir, stat } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const uploadDir = join(process.cwd(), 'uploads')
    const files = await readdir(uploadDir)
    // Filter out .gitkeep and only include .txt files
    const txtFiles = files.filter(file => file.toLowerCase().endsWith('.txt'))
    const sopFiles = await Promise.all(
      txtFiles.map(async (file) => {
        const filePath = join(uploadDir, file)
        const fileStat = await stat(filePath)
        return {
          name: file,
          uploadedAt: fileStat.birthtime,
        }
      })
    )
    // Sort by upload time, newest first
    sopFiles.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    return NextResponse.json({ sopFiles })
  } catch (error) {
    console.error('List SOP error:', error)
    return NextResponse.json(
      { error: 'Failed to list SOP files' },
      { status: 500 }
    )
  }
} 