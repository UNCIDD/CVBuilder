'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

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

      const allPublications = [...relatedPublications, ...otherPublications];

      const response = await fetch('/api/cv/biosketch/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publication_ids: allPublications,
          summary: personalStatement,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate biosketch');
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
