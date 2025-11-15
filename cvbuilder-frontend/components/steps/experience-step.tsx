'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRequest } from '@/lib/api';

interface ProfessionalExperience {
  id: number;
  title: string;
  institution: string;
  start_year: number;
  end_year: number | null;
}

interface ExperienceStepProps {
  selectedExperience: number[];
  onSelectionChange: (ids: number[]) => void;
}

export function ExperienceStep({ selectedExperience, onSelectionChange }: ExperienceStepProps) {
  const [experiences, setExperiences] = useState<ProfessionalExperience[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExperience();
  }, []);

  const fetchExperience = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiRequest<ProfessionalExperience[]>('/api/cv/professional-experience/');
      setExperiences(data);
      // Select all by default
      if (data.length > 0) {
        onSelectionChange(data.map((e: ProfessionalExperience) => e.id));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load experience data. Please try again.';
      setError(errorMessage);
      console.error('Error fetching experience:', err);
      
      // If it's an auth error, suggest logging in
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        setError('Please log in to view your data. Redirecting to login...');
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredExperiences = experiences.filter(exp =>
    exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.institution.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExperience = (id: number) => {
    if (selectedExperience.includes(id)) {
      onSelectionChange(selectedExperience.filter(eid => eid !== id));
    } else {
      onSelectionChange([...selectedExperience, id]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Experience</CardTitle>
        <CardDescription>
          All professional experience entries are selected by default. Uncheck any you'd like to exclude.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="search">Search Experience</Label>
          <Input
            id="search"
            placeholder="Search by title or institution..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="text-sm text-muted-foreground">
          {selectedExperience.length} of {experiences.length} selected
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="w-6 h-6" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : filteredExperiences.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? 'No experience entries found.' : 'No experience entries available.'}
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredExperiences.map(exp => (
              <div
                key={exp.id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <Checkbox
                  id={`exp-${exp.id}`}
                  checked={selectedExperience.includes(exp.id)}
                  onCheckedChange={() => toggleExperience(exp.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{exp.title}</div>
                  <p className="text-sm text-foreground mt-1">{exp.institution}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {exp.start_year} – {exp.end_year ? exp.end_year : 'Present'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
