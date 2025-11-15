"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Trash2, Plus, Search } from 'lucide-react'

const dummyExperience = [
  {
    id: 1,
    title: "Principal Investigator",
    institution: "University of California, San Francisco",
    startYear: 2019,
    endYear: null,
  },
  {
    id: 2,
    title: "Postdoctoral Fellow",
    institution: "Johns Hopkins University",
    startYear: 2015,
    endYear: 2019,
  },
  {
    id: 3,
    title: "Research Scientist",
    institution: "National Institutes of Health",
    startYear: 2012,
    endYear: 2015,
  },
]

export function ExperienceTab() {
  const [experience, setExperience] = useState(dummyExperience)
  const [search, setSearch] = useState("")
  const [openAdd, setOpenAdd] = useState(false)
  const [newEntry, setNewEntry] = useState({
    title: "",
    institution: "",
    startYear: new Date().getFullYear(),
    endYear: null as number | null,
  })

  const filtered = experience.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.institution.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = () => {
    if (newEntry.title.trim() && newEntry.institution.trim()) {
      setExperience([
        ...experience,
        {
          id: Math.max(...experience.map((e) => e.id), 0) + 1,
          ...newEntry,
        },
      ])
      setNewEntry({
        title: "",
        institution: "",
        startYear: new Date().getFullYear(),
        endYear: null,
      })
      setOpenAdd(false)
    }
  }

  const handleDelete = (id: number) => {
    setExperience(experience.filter((e) => e.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by title or institution..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Experience
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Professional Experience</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Title</label>
                <Input
                  placeholder="e.g., Principal Investigator"
                  value={newEntry.title}
                  onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Institution</label>
                <Input
                  placeholder="University or organization name"
                  value={newEntry.institution}
                  onChange={(e) => setNewEntry({ ...newEntry, institution: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Start Year</label>
                  <Input
                    type="number"
                    value={newEntry.startYear}
                    onChange={(e) => setNewEntry({ ...newEntry, startYear: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">End Year</label>
                  <Input
                    type="number"
                    placeholder="Leave blank if current"
                    value={newEntry.endYear || ""}
                    onChange={(e) =>
                      setNewEntry({
                        ...newEntry,
                        endYear: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    className="mt-1"
                  />
                </div>
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
          <p className="text-slate-500">No experience found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((exp) => (
            <Card key={exp.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{exp.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{exp.institution}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {exp.startYear}–{exp.endYear ? exp.endYear : "Present"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(exp.id)}
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
