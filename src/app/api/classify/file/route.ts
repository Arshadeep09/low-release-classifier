import { NextResponse } from 'next/server'
import { writeFile, readFile, mkdir, readdir, stat } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { GoogleGenAI } from '@google/genai'
import { ChromaClient } from 'chromadb'
import fetch from 'node-fetch'
import FormData from 'form-data'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
const chroma = new ChromaClient()
const COLLECTION_NAME = 'sop_chunks'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ['text/plain']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only TXT files are allowed.' },
        { status: 400 }
      )
    }

    // Save file temporarily
    const fileId = uuidv4()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${fileId}.${fileExtension}`
    const tempDir = join(process.cwd(), 'uploads', 'temp')
    const filePath = join(tempDir, fileName)

    // Ensure tempDir exists
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Extract text from the document
    const fileContent = await readFile(filePath, 'utf-8')

    // Find the latest .txt SOP in uploads
    const uploadDir = join(process.cwd(), 'uploads')
    const files = await readdir(uploadDir)
    const txtFiles = files.filter(f => f.toLowerCase().endsWith('.txt'))
    if (txtFiles.length === 0) {
      return NextResponse.json({ error: 'No SOP .txt file found. Please upload an SOP .txt file first.' }, { status: 400 })
    }
    // Find the latest .txt by modified time
    let latestFile = txtFiles[0]
    let latestMtime = (await stat(join(uploadDir, latestFile))).mtime
    for (const f of txtFiles) {
      const mtime = (await stat(join(uploadDir, f))).mtime
      if (mtime > latestMtime) {
        latestFile = f
        latestMtime = mtime
      }
    }
    const sopTxtPath = join(uploadDir, latestFile)
    const sopTxtContent = await readFile(sopTxtPath, 'utf-8')

    // Prepare the prompt
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
${fileContent}

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

    // Clean up temporary file
    await writeFile(filePath, '') // Clear the file
    // TODO: Delete the file

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