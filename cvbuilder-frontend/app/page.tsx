'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileText, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="border-b border-border/40 bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Biosketch</h1>
          {isLoading ? null : isAuthenticated ? (
            <Button variant="outline" size="sm" className="gap-2" onClick={logout}>
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm" className="gap-2">
                <LogOut className="w-4 h-4" />
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto py-20 md:py-28">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Professional Biographical Sketches
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Create polished, professional biosketches with your publications and academic credentials. Manage everything in one place.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* New Biosketch Card */}
            <Link href="/login">
              <div className="group relative bg-card border border-border/50 rounded-lg p-8 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                <div className="absolute -inset-px bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Create Biosketch</h3>
                <p className="text-muted-foreground mb-6">
                  Generate a new biosketch by selecting your education, experience, and publications.
                </p>
                <Button className="w-full">
                  Get Started
                </Button>
              </div>
            </Link>

            {/* Dashboard Card */}
            <Link href="/login">
              <div className="group relative bg-card border border-border/50 rounded-lg p-8 hover:border-accent/50 hover:shadow-md transition-all cursor-pointer">
                <div className="absolute -inset-px bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Settings className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">My Profile</h3>
                <p className="text-muted-foreground mb-6">
                  View and manage your publications, education, experience, and awards.
                </p>
                <Button variant="outline" className="w-full">
                  View Dashboard
                </Button>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
