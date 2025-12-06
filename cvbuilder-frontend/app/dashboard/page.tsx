"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PublicationsTab } from "@/components/dashboard/publications-tab"
import { EducationTab } from "@/components/dashboard/education-tab"
import { ExperienceTab } from "@/components/dashboard/experience-tab"
import { AwardsTab } from "@/components/dashboard/awards-tab"
import { BiosketchesTab } from "@/components/dashboard/biosketches-tab"
import Link from "next/link"
import { Plus } from 'lucide-react'
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("biosketches")

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="border-b border-border/40 bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Biosketch</h1>
          <Button variant="ghost" size="sm" onClick={logout}>
            Sign Out
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground">My Profile</h2>
            <p className="text-muted-foreground mt-1">Manage your academic information and biosketches</p>
          </div>
          <Link href="/biosketch/new">
            <Button size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              New Biosketch
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="border border-border/50 rounded-lg overflow-hidden bg-card">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 rounded-none border-b border-border/50 bg-secondary/30 p-0">
              <TabsTrigger 
                value="biosketches"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Biosketches
              </TabsTrigger>
              <TabsTrigger 
                value="publications"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Publications
              </TabsTrigger>
              <TabsTrigger 
                value="education"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Education
              </TabsTrigger>
              <TabsTrigger 
                value="experience"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Experience
              </TabsTrigger>
              <TabsTrigger 
                value="awards"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Awards
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="biosketches" className="mt-0">
                <BiosketchesTab />
              </TabsContent>

              <TabsContent value="publications" className="mt-0">
                <PublicationsTab />
              </TabsContent>

              <TabsContent value="education" className="mt-0">
                <EducationTab />
              </TabsContent>

              <TabsContent value="experience" className="mt-0">
                <ExperienceTab />
              </TabsContent>

              <TabsContent value="awards" className="mt-0">
                <AwardsTab />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
