'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { getAuthToken } from '@/lib/api';

interface GenerateBiosketechSectionProps {
  personalStatement: string;
  selectedPublications: number[];
  selectedEducation: number[];
  selectedExperience: number[];
  isGenerating: boolean;
  onGenerating: (value: boolean) => void;
}

export function GenerateBiosketechSection({
  personalStatement,
  selectedPublications,
  selectedEducation,
  selectedExperience,
  isGenerating,
  onGenerating,
}: GenerateBiosketechSectionProps) {
  const canGenerate =
    personalStatement.trim().length > 0 &&
    selectedPublications.length === 5;

  const handleGenerate = async () => {
    if (!canGenerate) return;

    try {
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
          publication_ids: selectedPublications,
          summary: personalStatement,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to generate biosketch' }));
        throw new Error(error.error || 'Failed to generate biosketch');
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
    } catch (error) {
      console.error('Error generating biosketch:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      onGenerating(false);
    }
  };

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Generate Biosketch</CardTitle>
        <CardDescription>Review and generate your biosketch</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Checklist */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Requirements</h3>
          
          <div className="flex items-center gap-2">
            {personalStatement.trim().length > 0 ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-muted-foreground" />
            )}
            <span className="text-sm">Personal statement added</span>
          </div>

          <div className="flex items-center gap-2">
            {selectedPublications.length === 5 ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-muted-foreground" />
            )}
            <span className="text-sm">
              Publications selected ({selectedPublications.length}/5)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {selectedEducation.length > 0 ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-muted-foreground" />
            )}
            <span className="text-sm">
              Education selected ({selectedEducation.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {selectedExperience.length > 0 ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-muted-foreground" />
            )}
            <span className="text-sm">
              Experience selected ({selectedExperience.length})
            </span>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Publications:</span>
            <span className="font-medium">{selectedPublications.length}/5</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Education Entries:</span>
            <span className="font-medium">{selectedEducation.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Experience Entries:</span>
            <span className="font-medium">{selectedExperience.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Statement Length:</span>
            <span className="font-medium">{personalStatement.length} chars</span>
          </div>
        </div>

        {/* Alerts */}
        {!canGenerate && (
          <Alert>
            <AlertDescription className="text-sm">
              {selectedPublications.length < 5
                ? `Select ${5 - selectedPublications.length} more publication(s)`
                : 'Add a personal statement to continue'}
            </AlertDescription>
          </Alert>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={!canGenerate || isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? 'Generating PDF...' : 'Generate Biosketch PDF'}
        </Button>
      </CardContent>
    </Card>
  );
}
