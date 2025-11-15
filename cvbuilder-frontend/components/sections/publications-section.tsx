'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Publication {
  id: number;
  doi: string;
  citation: string;
}

interface PublicationsSectionProps {
  selectedPublications: number[];
  onSelectionChange: (ids: number[]) => void;
}

export function PublicationsSection({ selectedPublications, onSelectionChange }: PublicationsSectionProps) {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublications();
  }, []);

  const fetchPublications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/cv/publications/');
      if (!response.ok) throw new Error('Failed to fetch publications');
      const data = await response.json();
      setPublications(data);
    } catch (err) {
      setError('Failed to load publications. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPublications = publications.filter(pub =>
    pub.doi.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pub.citation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggle = (id: number) => {
    if (selectedPublications.includes(id)) {
      onSelectionChange(selectedPublications.filter(pid => pid !== id));
    } else {
      if (selectedPublications.length < 5) {
        onSelectionChange([...selectedPublications, id]);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publications</CardTitle>
        <CardDescription>
          Search and select up to 5 publications to include in your biosketch
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="search">Search Publications</Label>
          <Input
            id="search"
            placeholder="Search by DOI or citation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="text-sm text-muted-foreground">
          Selected: {selectedPublications.length} / 5
        </div>

        {selectedPublications.length === 5 && (
          <Alert>
            <AlertDescription>
              You have selected the maximum of 5 publications.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="w-6 h-6" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : filteredPublications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? 'No publications found matching your search.' : 'No publications available.'}
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredPublications.map(pub => (
              <div
                key={pub.id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <Checkbox
                  id={`pub-${pub.id}`}
                  checked={selectedPublications.includes(pub.id)}
                  onCheckedChange={() => handleToggle(pub.id)}
                  disabled={selectedPublications.length === 5 && !selectedPublications.includes(pub.id)}
                />
                <div className="flex-1 min-w-0">
                  <Label
                    htmlFor={`pub-${pub.id}`}
                    className="text-sm font-medium cursor-pointer line-clamp-2"
                  >
                    {pub.citation || `DOI: ${pub.doi}`}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">{pub.doi}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
