"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Trash2, Plus, Search } from 'lucide-react'

const dummyPublications = [
  {
    id: 1,
    doi: "10.1038/nature.2024.15234",
    citation: "Smith J, et al. Novel approach to protein folding. Nature. 2024;589(1):45-52.",
  },
  {
    id: 2,
    doi: "10.1126/science.abo1234",
    citation: "Johnson M, et al. Machine learning for drug discovery. Science. 2023;380(2):102-108.",
  },
  {
    id: 3,
    doi: "10.1016/j.cell.2023.12.001",
    citation: "Lee K, et al. Systems biology approaches. Cell. 2023;186(5):1200-1215.",
  },
  {
    id: 4,
    doi: "10.1073/pnas.2310234120",
    citation: "Wang X, et al. CRISPR applications in therapeutics. PNAS. 2023;120(8):456-462.",
  },
]

export function PublicationsTab() {
  const [publications, setPublications] = useState(dummyPublications)
  const [search, setSearch] = useState("")
  const [openAdd, setOpenAdd] = useState(false)
  const [newDoi, setNewDoi] = useState("")
  const [newCitation, setNewCitation] = useState("")

  const filtered = publications.filter((p) =>
    p.doi.toLowerCase().includes(search.toLowerCase()) ||
    p.citation.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = () => {
    if (newDoi.trim() && newCitation.trim()) {
      setPublications([
        ...publications,
        {
          id: Math.max(...publications.map((p) => p.id), 0) + 1,
          doi: newDoi,
          citation: newCitation,
        },
      ])
      setNewDoi("")
      setNewCitation("")
      setOpenAdd(false)
    }
  }

  const handleDelete = (id: number) => {
    setPublications(publications.filter((p) => p.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by DOI or citation..."
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
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Citation</label>
                <textarea
                  placeholder="Full citation text..."
                  value={newCitation}
                  onChange={(e) => setNewCitation(e.target.value)}
                  className="w-full mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
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

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500">No publications found</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((pub) => (
            <Card key={pub.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-blue-600 break-all">{pub.doi}</p>
                  <p className="text-sm text-slate-700 mt-2 leading-relaxed">{pub.citation}</p>
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
