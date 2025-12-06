'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { getAuthToken } from '@/lib/api';

interface ReviewStepProps {
  personalStatement: string;
  selectedEducation: number[];
  selectedExperience: number[];
  relatedPublications: number[];
  otherPublications: number[];
  isGenerating: boolean;
  onGenerating: (value: boolean) => void;
}

export function ReviewStep({
  personalStatement,
  selectedEducation,
  selectedExperience,
  relatedPublications,
  otherPublications,
  isGenerating,
  onGenerating,
}: ReviewStepProps) {
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      setError(null);
      onGenerating(true);

      const token = getAuthToken();
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Token ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/cv/biosketch/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          related_publication_ids: relatedPublications,
          other_publication_ids: otherPublications,
          summary: personalStatement,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate biosketch' }));
        
        // Show detailed validation errors if available
        let errorMessage = 'Failed to generate biosketch';
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.related_publication_ids) {
          errorMessage = `Related publications: ${Array.isArray(errorData.related_publication_ids) ? errorData.related_publication_ids.join(', ') : errorData.related_publication_ids}`;
        } else if (errorData.other_publication_ids) {
          errorMessage = `Other publications: ${Array.isArray(errorData.other_publication_ids) ? errorData.other_publication_ids.join(', ') : errorData.other_publication_ids}`;
        } else if (errorData.summary) {
          errorMessage = `Summary: ${Array.isArray(errorData.summary) ? errorData.summary.join(', ') : errorData.summary}`;
        } else if (typeof errorData === 'object') {
          // Show all validation errors
          const errors = Object.entries(errorData)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('; ');
          if (errors) {
            errorMessage = errors;
          }
        }
        
        throw new Error(errorMessage);
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'nih_biosketch.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error generating biosketch:', err);
    } finally {
      onGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Review Your Selections</CardTitle>
          <CardDescription>Everything looks good? Generate your biosketch PDF.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Statement */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h3 className="font-medium">Personal Statement</h3>
            </div>
            <p className="text-sm text-muted-foreground pl-7">
              {personalStatement.length} characters entered
            </p>
          </div>

          {/* Education */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h3 className="font-medium">Education</h3>
            </div>
            <p className="text-sm text-muted-foreground pl-7">
              {selectedEducation.length} education entry/entries selected
            </p>
          </div>

          {/* Experience */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h3 className="font-medium">Professional Experience</h3>
            </div>
            <p className="text-sm text-muted-foreground pl-7">
              {selectedExperience.length} experience entry/entries selected
            </p>
          </div>

          {/* Publications */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h3 className="font-medium">Publications</h3>
            </div>
            <div className="pl-7 space-y-1 text-sm text-muted-foreground">
              <p>• {relatedPublications.length} most closely related to current research</p>
              <p>• {otherPublications.length} other significant publications</p>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? 'Generating PDF...' : 'Generate Biosketch PDF'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
