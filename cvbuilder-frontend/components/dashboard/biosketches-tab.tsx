"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, Trash2, Search, ExternalLink } from 'lucide-react'
import { apiRequest, getAuthToken } from "@/lib/api"
import Link from "next/link"

interface Biosketch {
  id: number;
  title: string;
  url: string;
  created_at: string;
}

export function BiosketchesTab() {
  const [biosketches, setBiosketches] = useState<Biosketch[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generatingId, setGeneratingId] = useState<number | null>(null)

  useEffect(() => {
    fetchBiosketches()
  }, [])

  const fetchBiosketches = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await apiRequest<Biosketch[]>('/api/cv/biosketches/')
      setBiosketches(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load biosketches')
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = biosketches.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this biosketch?')) {
      return
    }

    try {
      await apiRequest(`/api/cv/biosketches/${id}/`, {
        method: 'DELETE',
      })
      setBiosketches(biosketches.filter((b) => b.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete biosketch')
    }
  }

  const handleGenerate = async (biosketch: Biosketch) => {
    try {
      setGeneratingId(biosketch.id)
      setError(null)

      const token = getAuthToken()
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

      // Extract params from the stored URL (it's stored as a relative path)
      // Handle both full URLs (for backward compatibility) and relative paths
      let searchParams: URLSearchParams
      if (biosketch.url.includes('?')) {
        // Extract query string from relative path
        const queryString = biosketch.url.split('?')[1] || ''
        searchParams = new URLSearchParams(queryString)
      } else {
        searchParams = new URLSearchParams()
      }
      const params = searchParams

      const body: any = {
        related_publication_ids: params.get('related_publication_ids')?.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) || [],
        other_publication_ids: params.get('other_publication_ids')?.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) || [],
      }

      const personalStatementId = params.get('personal_statement_id')
      const customStatement = params.get('custom_statement')

      if (personalStatementId) {
        body.personal_statement_id = parseInt(personalStatementId)
      } else if (customStatement) {
        body.summary = decodeURIComponent(customStatement)
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (token) {
        headers['Authorization'] = `Token ${token}`
      }

      const response = await fetch(`${API_BASE_URL}/api/cv/biosketch/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate biosketch' }))
        throw new Error(errorData.error || 'Failed to generate biosketch')
      }

      // Download the PDF
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${biosketch.title.replace(/[^a-z0-9]/gi, '_')}_biosketch.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF')
    } finally {
      setGeneratingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="w-6 h-6" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search biosketches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500">
            {search ? 'No biosketches found matching your search' : 'No biosketches saved yet. Create one to get started!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((biosketch) => {
            // Use the stored URL directly (it's stored as a relative path)
            const viewUrl = biosketch.url.startsWith('/') ? biosketch.url : `/${biosketch.url}`

            return (
              <Card key={biosketch.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{biosketch.title}</h3>
                    <div className="flex gap-4 mt-3">
                      <span className="text-xs text-slate-500">
                        Created: {new Date(biosketch.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link href={viewUrl}>
                      <Button size="sm" variant="outline" className="gap-2">
                        <ExternalLink className="w-4 h-4" />
                        View
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => handleGenerate(biosketch)}
                      disabled={generatingId === biosketch.id}
                    >
                      {generatingId === biosketch.id ? (
                        <>
                          <Spinner className="w-4 h-4" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Download
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(biosketch.id)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
