"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Trash2, Plus, Search } from 'lucide-react'
import { apiRequest } from '@/lib/api'

interface Award {
  id: number;
  name: string;
  year: number;
}

export function AwardsTab() {
  const [awards, setAwards] = useState<Award[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [openAdd, setOpenAdd] = useState(false)
  const [newEntry, setNewEntry] = useState({
    name: "",
    year: new Date().getFullYear(),
  })

  useEffect(() => {
    fetchAwards()
  }, [])

  const fetchAwards = async () => {
    try {
      setIsLoading(true)
      const data = await apiRequest<Award[]>('/api/cv/awards/')
      setAwards(data)
    } catch (err) {
      console.error('Failed to fetch awards:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = awards.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = () => {
    if (newEntry.name.trim()) {
      setAwards([
        ...awards,
        {
          id: Math.max(...awards.map((a) => a.id), 0) + 1,
          ...newEntry,
        },
      ])
      setNewEntry({
        name: "",
        year: new Date().getFullYear(),
      })
      setOpenAdd(false)
    }
  }

  const handleDelete = (id: number) => {
    setAwards(awards.filter((a) => a.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search awards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Award
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Award</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Award Name</label>
                <Input
                  placeholder="e.g., NSF CAREER Award"
                  value={newEntry.name}
                  onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Year</label>
                <Input
                  type="number"
                  value={newEntry.year}
                  onChange={(e) => setNewEntry({ ...newEntry, year: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setOpenAdd(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd}>Add</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Loading awards...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500">No awards found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((award) => (
            <Card key={award.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{award.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{award.year}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(award.id)}
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
