'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRequest } from '@/lib/api';

interface Education {
  id: number;
  school_name: string;
  location: string;
  grad_year: number;
  degree_type: string;
  field_of_study: string;
}

interface EducationStepProps {
  selectedEducation: number[];
  onSelectionChange: (ids: number[]) => void;
}

export function EducationStep({ selectedEducation, onSelectionChange }: EducationStepProps) {
  const [educations, setEducations] = useState<Education[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEducation();
  }, []);

  const fetchEducation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiRequest<Education[]>('/api/cv/education/');
      setEducations(data);
      // Select all by default
      if (data.length > 0) {
        onSelectionChange(data.map((e: Education) => e.id));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load education data. Please try again.';
      setError(errorMessage);
      console.error('Error fetching education:', err);
      
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

  const filteredEducations = educations.filter(edu =>
    edu.school_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    edu.field_of_study.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleEducation = (id: number) => {
    if (selectedEducation.includes(id)) {
      onSelectionChange(selectedEducation.filter(eid => eid !== id));
    } else {
      onSelectionChange([...selectedEducation, id]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Education</CardTitle>
        <CardDescription>
          All education entries are selected by default. Uncheck any you'd like to exclude.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="search">Search Education</Label>
          <Input
            id="search"
            placeholder="Search by school or field of study..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="text-sm text-muted-foreground">
          {selectedEducation.length} of {educations.length} selected
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="w-6 h-6" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : filteredEducations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? 'No education entries found.' : 'No education entries available.'}
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredEducations.map(edu => (
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
      </CardContent>
    </Card>
  );
}
