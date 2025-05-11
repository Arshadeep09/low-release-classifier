'use client'

import { useState, useEffect } from 'react'

interface SOPFile {
  name: string
  uploadedAt: string
}

export default function AdminDashboard() {
  const [sopFiles, setSopFiles] = useState<SOPFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSOPFiles = async () => {
      try {
        const response = await fetch('/api/sop/list')
        if (!response.ok) throw new Error('Failed to fetch SOP files')
        const data = await response.json()
        setSopFiles(data.sopFiles)
      } catch (err) {
        setError('Failed to fetch SOP files')
      }
    }
    fetchSOPFiles()
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/sop/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      // Refresh the SOP file list after upload
      const listResponse = await fetch('/api/sop/list')
      if (listResponse.ok) {
        const data = await listResponse.json()
        setSopFiles(data.sopFiles)
      }
    } catch (err) {
      setError('Failed to upload SOP document')
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Upload New SOP Document
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Upload a new version of the SOP document (.txt only).</p>
          </div>
          <div className="mt-5">
            <input
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              disabled={uploading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100"
            />
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Uploaded SOP Documents
          </h3>
          <div className="mt-4">
            {sopFiles.length === 0 ? (
              <p className="text-sm text-gray-500">No SOP documents uploaded yet.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {sopFiles.map((file) => (
                  <li key={file.name} className="py-2 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 truncate">{file.name}</span>
                    <span className="text-xs text-gray-500 ml-2">Uploaded {new Date(file.uploadedAt).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 