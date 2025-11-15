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

interface PublicationsStepProps {
  relatedPublications: number[];
  otherPublications: number[];
  onRelatedChange: (ids: number[]) => void;
  onOtherChange: (ids: number[]) => void;
}

export function PublicationsStep({
  relatedPublications,
  otherPublications,
  onRelatedChange,
  onOtherChange,
}: PublicationsStepProps) {
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

  const allSelected = [...relatedPublications, ...otherPublications];

  const toggleRelated = (id: number) => {
    if (relatedPublications.includes(id)) {
      onRelatedChange(relatedPublications.filter(pid => pid !== id));
    } else {
      if (relatedPublications.length < 5 && !otherPublications.includes(id)) {
        onRelatedChange([...relatedPublications, id]);
      }
    }
  };

  const toggleOther = (id: number) => {
    if (otherPublications.includes(id)) {
      onOtherChange(otherPublications.filter(pid => pid !== id));
    } else {
      if (otherPublications.length < 5 && !relatedPublications.includes(id)) {
        onOtherChange([...otherPublications, id]);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Publications</CardTitle>
          <CardDescription>
            Select 5 publications most closely related to your current research, and 5 other significant publications.
            You cannot select the same publication for both sections.
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
              {filteredPublications.map(pub => {
                const isInRelated = relatedPublications.includes(pub.id);
                const isInOther = otherPublications.includes(pub.id);

                return (
                  <div key={pub.id} className="flex flex-col gap-2 p-3 border rounded-lg hover:bg-secondary/30 transition-colors">
                    <div className="flex items-start gap-2">
                      <Label htmlFor={`pub-${pub.id}`} className="text-sm font-medium cursor-pointer line-clamp-2 flex-1">
                        {pub.citation || `DOI: ${pub.doi}`}
                      </Label>
                      <p className="text-xs text-muted-foreground">{pub.doi}</p>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`related-${pub.id}`}
                          checked={isInRelated}
                          onCheckedChange={() => toggleRelated(pub.id)}
                          disabled={relatedPublications.length === 5 && !isInRelated}
                        />
                        <Label htmlFor={`related-${pub.id}`} className="text-xs font-normal cursor-pointer">
                          Related ({relatedPublications.length}/5)
                        </Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`other-${pub.id}`}
                          checked={isInOther}
                          onCheckedChange={() => toggleOther(pub.id)}
                          disabled={otherPublications.length === 5 && !isInOther}
                        />
                        <Label htmlFor={`other-${pub.id}`} className="text-xs font-normal cursor-pointer">
                          Other ({otherPublications.length}/5)
                        </Label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{relatedPublications.length}</div>
              <p className="text-sm text-muted-foreground mt-1">Most Closely Related</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{otherPublications.length}</div>
              <p className="text-sm text-muted-foreground mt-1">Other Significant</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
