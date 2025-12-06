"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Trash2, Plus, Search } from 'lucide-react'
import { apiRequest } from '@/lib/api'

interface Education {
  id: number;
  school_name: string;
  location: string;
  grad_year: number;
  degree_type: string;
  field_of_study: string;
}

export function EducationTab() {
  const [education, setEducation] = useState<Education[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [openAdd, setOpenAdd] = useState(false)
  const [newEntry, setNewEntry] = useState({
    schoolName: "",
    location: "",
    gradYear: new Date().getFullYear(),
    degreeType: "",
    fieldOfStudy: "",
  })

  useEffect(() => {
    fetchEducation()
  }, [])

  const fetchEducation = async () => {
    try {
      setIsLoading(true)
      const data = await apiRequest<Education[]>('/api/cv/education/')
      setEducation(data)
    } catch (err) {
      console.error('Failed to fetch education:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = education.filter((e) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      (e.school_name?.toLowerCase().includes(searchLower) ?? false) ||
      (e.field_of_study?.toLowerCase().includes(searchLower) ?? false)
    )
  })

  const handleAdd = async () => {
    if (
      newEntry.schoolName.trim() &&
      newEntry.fieldOfStudy.trim() &&
      newEntry.degreeType.trim()
    ) {
      try {
        const data = {
          school_name: newEntry.schoolName,
          location: newEntry.location,
          grad_year: newEntry.gradYear,
          degree_type: newEntry.degreeType,
          field_of_study: newEntry.fieldOfStudy,
        }
        await apiRequest('/api/cv/education/', {
          method: 'POST',
          body: JSON.stringify(data),
        })
        await fetchEducation()
        setNewEntry({
          schoolName: "",
          location: "",
          gradYear: new Date().getFullYear(),
          degreeType: "",
          fieldOfStudy: "",
        })
        setOpenAdd(false)
      } catch (err) {
        console.error('Failed to add education:', err)
      }
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await apiRequest(`/api/cv/education/${id}/`, {
        method: 'DELETE',
      })
      await fetchEducation()
    } catch (err) {
      console.error('Failed to delete education:', err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by school or field of study..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Education
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Education</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">School Name</label>
                <Input
                  placeholder="University name"
                  value={newEntry.schoolName}
                  onChange={(e) => setNewEntry({ ...newEntry, schoolName: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Location</label>
                <Input
                  placeholder="City, State"
                  value={newEntry.location}
                  onChange={(e) => setNewEntry({ ...newEntry, location: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Degree</label>
                  <Input
                    placeholder="Ph.D., B.S., etc"
                    value={newEntry.degreeType}
                    onChange={(e) => setNewEntry({ ...newEntry, degreeType: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Graduation Year</label>
                  <Input
                    type="number"
                    value={newEntry.gradYear}
                    onChange={(e) => setNewEntry({ ...newEntry, gradYear: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Field of Study</label>
                <Input
                  placeholder="e.g., Molecular Biology"
                  value={newEntry.fieldOfStudy}
                  onChange={(e) => setNewEntry({ ...newEntry, fieldOfStudy: e.target.value })}
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
          <p className="text-slate-500">Loading education...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500">No education found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((edu) => (
            <Card key={edu.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-semibold text-slate-900">
                      {edu.degree_type || 'Degree'} {edu.field_of_study ? `in ${edu.field_of_study}` : ''}
                    </h3>
                    {edu.grad_year && (
                      <span className="text-sm text-slate-500">({edu.grad_year})</span>
                    )}
                  </div>
                  {edu.school_name && (
                    <p className="text-sm text-slate-600 mt-1">{edu.school_name}</p>
                  )}
                  {edu.location && (
                    <p className="text-xs text-slate-500 mt-1">{edu.location}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(edu.id)}
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
