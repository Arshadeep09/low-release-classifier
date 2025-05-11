import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { readdir, stat, readFile } from 'fs/promises'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      )
    }

    // Find the latest .txt SOP in uploads
    const uploadDir = process.cwd() + '/uploads'
    const files = await readdir(uploadDir)
    const txtFiles = files.filter(f => f.toLowerCase().endsWith('.txt'))
    if (txtFiles.length === 0) {
      return NextResponse.json({ error: 'No SOP .txt file found. Please upload an SOP .txt file first.' }, { status: 400 })
    }
    // Find the latest .txt by modified time
    let latestFile = txtFiles[0]
    let latestMtime = (await stat(uploadDir + '/' + latestFile)).mtime
    for (const f of txtFiles) {
      const mtime = (await stat(uploadDir + '/' + f)).mtime
      if (mtime > latestMtime) {
        latestFile = f
        latestMtime = mtime
      }
    }
    const sopTxtPath = uploadDir + '/' + latestFile
    const sopTxtContent = await readFile(sopTxtPath, 'utf-8')

    // Improved prompt for metadata extraction
    const prompt = `Based on the following SOP, determine if the feature description qualifies for Slow Release. 
Provide a clear yes/no answer, justification, and cite relevant SOP sections.

Additionally, extract and return any available metadata from the SOP, such as:
- SOP Title
- SOP Version
- Effective Date
- Author or Owner
- Any other relevant metadata

SOP:
${sopTxtContent}

Feature Description:
${text}

Respond ONLY with a valid JSON object, no explanation, no markdown, no code block. 
Format your response as JSON:
{
  "isSlowRelease": boolean,
  "justification": string,
  "referencedSections": string[],
  "metadata": {
    "title": string,
    "version": string,
    "effectiveDate": string,
    "author": string,
    "other": string
  }
}`

    // Call Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    })
    const resultText = response.text
    if (!resultText) {
      throw new Error('No response from Gemini API')
    }
    // Extract JSON from the response, even if wrapped in code block or extra text
    const jsonMatch = resultText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Gemini response: ' + resultText)
    }
    const result = JSON.parse(jsonMatch[0])

    return NextResponse.json(result)
  } catch (error) {
    console.error('Classification error:', error)
    let message = 'Unknown error'
    if (error instanceof Error) {
      message = error.message
    } else if (typeof error === 'string') {
      message = error
    }
    return NextResponse.json(
      { error: 'Failed to classify feature', details: message },
      { status: 500 }
    )
  }
} 