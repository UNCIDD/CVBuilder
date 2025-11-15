"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Download, Trash2, Search } from 'lucide-react'

const dummyBiosketches = [
  {
    id: 1,
    name: "NSF CAREER Award",
    createdAt: "2024-01-15",
    publications: 10,
    statement: "Research focused on computational biology...",
  },
  {
    id: 2,
    name: "NIH R01 Grant",
    createdAt: "2024-01-10",
    publications: 10,
    statement: "Pioneering work in drug discovery...",
  },
  {
    id: 3,
    name: "Faculty Application",
    createdAt: "2024-01-05",
    publications: 10,
    statement: "Interdisciplinary research in systems biology...",
  },
]

export function BiosketchesTab() {
  const [biosketches, setBiosketches] = useState(dummyBiosketches)
  const [search, setSearch] = useState("")

  const filtered = biosketches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.statement.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = (id: number) => {
    setBiosketches(biosketches.filter((b) => b.id !== id))
  }

  return (
    <div className="space-y-6">
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
          <p className="text-slate-500">No biosketches found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((biosketch) => (
            <Card key={biosketch.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{biosketch.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{biosketch.statement}</p>
                  <div className="flex gap-4 mt-3">
                    <span className="text-xs text-slate-500">
                      Created: {new Date(biosketch.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-slate-500">
                      {biosketch.publications} publications
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download
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
          ))}
        </div>
      )}
    </div>
  )
}
