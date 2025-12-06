'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/api';

interface Education {
  id: number;
  school_name: string;
  location: string;
  grad_year: number;
  degree_type: string;
  field_of_study: string;
}

interface ProfessionalExperience {
  id: number;
  title: string;
  institution: string;
  start_year: number;
  end_year: number | null;
}

interface ExperienceEducationSectionProps {
  selectedEducation: number[];
  selectedExperience: number[];
  onEducationChange: (ids: number[]) => void;
  onExperienceChange: (ids: number[]) => void;
}

export function ExperienceEducationSection({
  selectedEducation,
  selectedExperience,
  onEducationChange,
  onExperienceChange,
}: ExperienceEducationSectionProps) {
  const [educations, setEducations] = useState<Education[]>([]);
  const [experiences, setExperiences] = useState<ProfessionalExperience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [eduData, expData] = await Promise.all([
        apiRequest<Education[]>('/api/cv/education/'),
        apiRequest<ProfessionalExperience[]>('/api/cv/professional-experience/')
      ]);
      
      setEducations(eduData);
      setExperiences(expData);
      
      // Select all by default
      if (eduData.length > 0) {
        onEducationChange(eduData.map((e: Education) => e.id));
      }
      if (expData.length > 0) {
        onExperienceChange(expData.map((e: ProfessionalExperience) => e.id));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load education and experience data.';
      setError(errorMessage);
      console.error('Error fetching education/experience:', err);
      
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

  const toggleEducation = (id: number) => {
    if (selectedEducation.includes(id)) {
      onEducationChange(selectedEducation.filter(eid => eid !== id));
    } else {
      onEducationChange([...selectedEducation, id]);
    }
  };

  const toggleExperience = (id: number) => {
    if (selectedExperience.includes(id)) {
      onExperienceChange(selectedExperience.filter(eid => eid !== id));
    } else {
      onExperienceChange([...selectedExperience, id]);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Spinner className="w-6 h-6" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Experience & Education</CardTitle>
        <CardDescription>
          Select which entries to include. All are selected by default.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="education" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
          </TabsList>

          <TabsContent value="education" className="space-y-3 mt-4">
            {educations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No education entries found.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {educations.map(edu => (
                  <div
                    key={edu.id}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <Checkbox
                      id={`edu-${edu.id}`}
                      checked={selectedEducation.includes(edu.id)}
                      onCheckedChange={() => toggleEducation(edu.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-medium text-sm">{edu.degree_type}</span>
                        <span className="text-sm text-muted-foreground">in {edu.field_of_study}</span>
                      </div>
                      <p className="text-sm text-foreground mt-1">{edu.school_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {edu.location} • {edu.grad_year}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="experience" className="space-y-3 mt-4">
            {experiences.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No experience entries found.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {experiences.map(exp => (
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
