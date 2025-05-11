'use client'

import { useState } from 'react'

interface ClassificationResult {
  isSlowRelease: boolean
  justification: string
  referencedSections: string[]
  metadata?: {
    title?: string
    version?: string
    effectiveDate?: string
    author?: string
    other?: string
  }
}

export default function UserDashboard() {
  const [featureText, setFeatureText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ClassificationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!featureText.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: featureText }),
      })

      if (!response.ok) {
        throw new Error('Classification failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError('Failed to classify feature')
      console.error('Classification error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setLoading(true)
    setError('')
    setResult(null)

    const formData = new FormData()
    formData.append('file', uploadedFile)

    try {
      const response = await fetch('/api/classify/file', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Classification failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError('Failed to classify feature')
      console.error('Classification error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-10 px-2 sm:px-0 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-8">
        <div className="bg-white/90 shadow-xl rounded-2xl p-8 border border-indigo-100">
          <h3 className="text-2xl font-bold text-indigo-700 mb-2 flex items-center gap-2">
            <span className="inline-block w-2 h-6 bg-indigo-500 rounded-full mr-2"></span>
            Classify Feature
          </h3>
          <div className="mb-6 text-gray-600">
            <p>
              Upload a PRD file or paste the feature description to determine if it qualifies for <span className="font-semibold text-indigo-600">Slow Release</span>.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Upload PRD File <span className="text-xs text-gray-400">(.txt only)</span>
              </label>
              <input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                disabled={loading}
                className="block w-full text-sm text-gray-700 border border-indigo-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 file:bg-indigo-50 file:text-indigo-700 file:rounded-md file:mr-3 file:py-2 file:px-4 hover:file:bg-indigo-100"
              />
              <p className="text-xs text-gray-400 mt-1">Only .txt files are supported.</p>
            </div>

            <div className="relative flex items-center justify-center my-4">
              <div className="flex-grow border-t border-gray-200" />
              <span className="mx-4 text-gray-400 text-xs">OR</span>
              <div className="flex-grow border-t border-gray-200" />
            </div>

            <form onSubmit={handleTextSubmit} className="space-y-4">
              <div>
                <label htmlFor="feature-text" className="block text-sm font-semibold text-gray-700 mb-1">
                  Paste Feature Description
                </label>
                <textarea
                  id="feature-text"
                  rows={4}
                  className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 text-gray-900 bg-white"
                  value={featureText}
                  onChange={(e) => setFeatureText(e.target.value)}
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !featureText.trim()}
                className="w-full py-2 px-4 rounded-lg bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Classify'}
              </button>
            </form>
          </div>

          {error && <p className="mt-4 text-sm text-red-600 text-center font-semibold">{error}</p>}

          {result && (
            <div className="mt-8">
              <div className={`rounded-2xl shadow-lg p-6 border ${result.isSlowRelease ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                <h4 className={`text-xl font-bold mb-2 ${result.isSlowRelease ? 'text-yellow-700' : 'text-green-700'}`}>
                  {result.isSlowRelease
                    ? 'Feature Qualifies for Slow Release'
                    : 'Feature Does Not Qualify for Slow Release'}
                </h4>
                <p className="mb-4 text-gray-700">{result.justification}</p>
                {result.referencedSections.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-semibold text-gray-700 mb-1">Referenced SOP Sections:</h5>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {result.referencedSections.map((section, index) => (
                        <li key={index}>{section}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.metadata && (
                  <div className="mt-4 bg-white/80 rounded-lg p-4 border border-indigo-100">
                    <h5 className="text-sm font-semibold text-indigo-700 mb-2">Extracted SOP Metadata</h5>
                    <ul className="text-xs text-gray-700 space-y-1">
                      {result.metadata.title && <li><span className="font-semibold">Title:</span> {result.metadata.title}</li>}
                      {result.metadata.version && <li><span className="font-semibold">Version:</span> {result.metadata.version}</li>}
                      {result.metadata.effectiveDate && <li><span className="font-semibold">Effective Date:</span> {result.metadata.effectiveDate}</li>}
                      {result.metadata.author && <li><span className="font-semibold">Author:</span> {result.metadata.author}</li>}
                      {result.metadata.other && <li><span className="font-semibold">Other:</span> {result.metadata.other}</li>}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 