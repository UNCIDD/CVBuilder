"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Trash2, Plus, Search } from 'lucide-react'
import { apiRequest } from '@/lib/api'

interface Publication {
  id: number;
  doi: string;
  citation?: string;
  title?: string;
  authors?: string;
  journal?: string;
  year?: number;
  volume?: string;
  issue?: string;
  pages?: string;
}

export function PublicationsTab() {
  const [publications, setPublications] = useState<Publication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [openAdd, setOpenAdd] = useState(false)
  const [newDoi, setNewDoi] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    fetchPublications()
  }, [])

  const fetchPublications = async () => {
    try {
      setIsLoading(true)
      const data = await apiRequest<Publication[]>('/api/cv/publications/')
      setPublications(data)
    } catch (err) {
      console.error('Failed to fetch publications:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = publications.filter((p) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      p.doi?.toLowerCase().includes(searchLower) ||
      p.title?.toLowerCase().includes(searchLower) ||
      p.citation?.toLowerCase().includes(searchLower) ||
      p.authors?.toLowerCase().includes(searchLower) ||
      p.journal?.toLowerCase().includes(searchLower)
    )
  })

  const handleAdd = async () => {
    if (!newDoi.trim()) return

    try {
      setIsAdding(true)
      const data = {
        doi: newDoi.trim(),
      }
      await apiRequest('/api/cv/publications/', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      await fetchPublications()
      setNewDoi("")
      setOpenAdd(false)
    } catch (err) {
      console.error('Failed to add publication:', err)
      alert('Failed to add publication. Please check the DOI and try again.')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await apiRequest(`/api/cv/publications/${id}/`, {
        method: 'DELETE',
      })
      await fetchPublications()
    } catch (err) {
      console.error('Failed to delete publication:', err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by DOI, title, authors, or journal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Publication
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Publication</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">DOI</label>
                <Input
                  placeholder="10.1038/nature.2024.15234"
                  value={newDoi}
                  onChange={(e) => setNewDoi(e.target.value)}
                  className="mt-1"
                  disabled={isAdding}
                />
                <p className="text-xs text-slate-500 mt-1">
                  The citation and other metadata will be automatically fetched from the DOI.
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setOpenAdd(false)
                    setNewDoi("")
                  }}
                  disabled={isAdding}
                >
                  Cancel
                </Button>
                <Button onClick={handleAdd} disabled={isAdding || !newDoi.trim()}>
                  {isAdding ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Loading publications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500">No publications found</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((pub) => (
            <Card key={pub.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {pub.title && (
                    <h3 className="font-semibold text-slate-900 mb-1">{pub.title}</h3>
                  )}
                  {pub.authors && (
                    <p className="text-sm text-slate-600 mb-1">{pub.authors}</p>
                  )}
                  {pub.journal && (
                    <p className="text-sm text-slate-600 mb-1">
                      {pub.journal}
                      {pub.year && ` (${pub.year})`}
                      {pub.volume && `, Vol. ${pub.volume}`}
                      {pub.issue && `, Issue ${pub.issue}`}
                      {pub.pages && `, pp. ${pub.pages}`}
                    </p>
                  )}
                  {pub.citation && !pub.title && (
                    <p className="text-sm text-slate-700 mt-2 leading-relaxed">{pub.citation}</p>
                  )}
                  <p className="text-xs font-mono text-blue-600 break-all mt-2">{pub.doi}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(pub.id)}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
