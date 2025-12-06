'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Save, Search } from 'lucide-react';
import { apiRequest, getAuthToken } from '@/lib/api';

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

interface Publication {
  id: number;
  doi: string;
  citation?: string;
  title?: string;
  authors?: string;
  journal?: string;
  year?: number;
  volume?: string;
  issue?: string;
  pages?: string;
}

interface PersonalStatement {
  id: number;
  title: string;
  content: string;
}

export function BiosketchForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Form state
  const [personalStatementId, setPersonalStatementId] = useState<number | null>(null);
  const [customStatement, setCustomStatement] = useState('');
  const [useCustomStatement, setUseCustomStatement] = useState(false);
  const [selectedEducation, setSelectedEducation] = useState<number[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<number[]>([]);
  const [relatedPublications, setRelatedPublications] = useState<number[]>([]);
  const [otherPublications, setOtherPublications] = useState<number[]>([]);
  
  // Data loading
  const [personalStatements, setPersonalStatements] = useState<PersonalStatement[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [experiences, setExperiences] = useState<ProfessionalExperience[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eduSearchQuery, setEduSearchQuery] = useState('');
  const [pubSearchQuery, setPubSearchQuery] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');

  // Load data from URL params or biosketch ID on mount
  useEffect(() => {
    const loadFromParams = async () => {
      const biosketchId = searchParams.get('biosketch_id');
      
      // If loading from a saved biosketch, redirect to the URL stored in it
      if (biosketchId) {
        try {
          const biosketch = await apiRequest<{ url: string }>(`/api/cv/biosketches/${biosketchId}/`);
          // The URL is stored as a relative path, so use it directly
          router.push(biosketch.url.startsWith('/') ? biosketch.url : `/${biosketch.url}`);
          return;
        } catch (err) {
          setError('Failed to load biosketch');
        }
        return;
      }
      
      // Otherwise load from URL params
      const psId = searchParams.get('personal_statement_id');
      const eduIds = searchParams.get('education_ids');
      const expIds = searchParams.get('experience_ids');
      const relatedIds = searchParams.get('related_publication_ids');
      const otherIds = searchParams.get('other_publication_ids');
      const customPs = searchParams.get('custom_statement');

      if (psId) {
        setPersonalStatementId(parseInt(psId));
        setUseCustomStatement(false);
      } else if (customPs) {
        setCustomStatement(decodeURIComponent(customPs));
        setUseCustomStatement(true);
      }

      if (eduIds) {
        setSelectedEducation(eduIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)));
      }

      if (expIds) {
        setSelectedExperience(expIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)));
      }

      if (relatedIds) {
        setRelatedPublications(relatedIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)));
      }

      if (otherIds) {
        setOtherPublications(otherIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)));
      }
    };

    loadFromParams();
  }, [searchParams, router]);

  // Fetch all data
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setIsLoading(true);
        const [psData, eduData, expData, pubData] = await Promise.all([
          apiRequest<PersonalStatement[]>('/api/cv/personal-statements/').catch(() => []),
          apiRequest<Education[]>('/api/cv/education/'),
          apiRequest<ProfessionalExperience[]>('/api/cv/professional-experience/'),
          apiRequest<Publication[]>('/api/cv/publications/'),
        ]);

        setPersonalStatements(psData);
        setEducations(eduData);
        setExperiences(expData);
        setPublications(pubData);

        // Select all by default if not loaded from params
        if (selectedEducation.length === 0 && eduData.length > 0) {
          setSelectedEducation(eduData.map(e => e.id));
        }
        if (selectedExperience.length === 0 && expData.length > 0) {
          setSelectedExperience(expData.map(e => e.id));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, []);

  const buildUrl = () => {
    const params = new URLSearchParams();
    
    if (useCustomStatement && customStatement) {
      params.set('custom_statement', encodeURIComponent(customStatement));
    } else if (personalStatementId) {
      params.set('personal_statement_id', personalStatementId.toString());
    }
    
    if (selectedEducation.length > 0) {
      params.set('education_ids', selectedEducation.join(','));
    }
    if (selectedExperience.length > 0) {
      params.set('experience_ids', selectedExperience.join(','));
    }
    if (relatedPublications.length > 0) {
      params.set('related_publication_ids', relatedPublications.join(','));
    }
    if (otherPublications.length > 0) {
      params.set('other_publication_ids', otherPublications.join(','));
    }

    return `/biosketch/new?${params.toString()}`;
  };

  const handleSave = async () => {
    if (!saveTitle.trim()) {
      setError('Please enter a title for this biosketch');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const url = buildUrl();
      // Store just the relative URL (path + query params)
      // This makes it portable and doesn't depend on the origin

      await apiRequest('/api/cv/biosketches/', {
        method: 'POST',
        body: JSON.stringify({
          title: saveTitle.trim(),
          url: url,
        }),
      });

      setShowSaveDialog(false);
      setSaveTitle('');
      // Redirect to dashboard to see the saved biosketch
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save biosketch');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setError(null);
      setIsGenerating(true);

      const token = getAuthToken();
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Token ${token}`;
      }

      const body: any = {
        related_publication_ids: relatedPublications,
        other_publication_ids: otherPublications,
      };

      if (useCustomStatement) {
        body.summary = customStatement;
      } else if (personalStatementId) {
        body.personal_statement_id = personalStatementId;
      } else {
        throw new Error('Please select a personal statement or enter a custom statement');
      }

      const response = await fetch(`${API_BASE_URL}/api/cv/biosketch/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate biosketch' }));
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
      setIsGenerating(false);
    }
  };

  const filteredEducations = educations.filter(edu =>
    edu.school_name.toLowerCase().includes(eduSearchQuery.toLowerCase()) ||
    edu.field_of_study.toLowerCase().includes(eduSearchQuery.toLowerCase())
  );

  const filteredExperiences = experiences.filter(exp =>
    exp.title.toLowerCase().includes(eduSearchQuery.toLowerCase()) ||
    exp.institution.toLowerCase().includes(eduSearchQuery.toLowerCase())
  );

  const filteredPublications = publications.filter(pub => {
    if (!pubSearchQuery) return true;
    const searchLower = pubSearchQuery.toLowerCase();
    return (
      pub.doi?.toLowerCase().includes(searchLower) ||
      pub.title?.toLowerCase().includes(searchLower) ||
      pub.citation?.toLowerCase().includes(searchLower) ||
      pub.authors?.toLowerCase().includes(searchLower) ||
      pub.journal?.toLowerCase().includes(searchLower)
    );
  });

  const isFormValid = 
    (useCustomStatement && customStatement.trim().length > 0) || 
    (!useCustomStatement && personalStatementId !== null) &&
    relatedPublications.length === 5 &&
    otherPublications.length === 5;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">Biosketch Generator</h1>
              <p className="text-muted-foreground mt-1">Create your professional biographical sketch</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(true)}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save Biosketch
              </Button>
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close and return to dashboard"
                >
                  <X className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Personal Statement Section */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Statement</CardTitle>
            <CardDescription>
              Select a saved personal statement or enter a custom one
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="use-custom"
                checked={useCustomStatement}
                onCheckedChange={(checked) => setUseCustomStatement(checked as boolean)}
              />
              <Label htmlFor="use-custom" className="cursor-pointer">
                Use custom statement
              </Label>
            </div>

            {useCustomStatement ? (
              <div className="space-y-2">
                <Label htmlFor="custom-statement">Custom Statement</Label>
                <Textarea
                  id="custom-statement"
                  placeholder="Enter your personal statement here..."
                  value={customStatement}
                  onChange={(e) => setCustomStatement(e.target.value)}
                  className="min-h-32"
                />
                <p className="text-sm text-muted-foreground">
                  {customStatement.length} characters
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="personal-statement">Select Personal Statement</Label>
                <select
                  id="personal-statement"
                  value={personalStatementId?.toString() || ''}
                  onChange={(e) => setPersonalStatementId(e.target.value ? parseInt(e.target.value) : null)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select a personal statement</option>
                  {personalStatements.map(ps => (
                    <option key={ps.id} value={ps.id.toString()}>
                      {ps.title}
                    </option>
                  ))}
                </select>
                {personalStatementId && (
                  <div className="p-3 bg-muted rounded-md text-sm">
                    {personalStatements.find(ps => ps.id === personalStatementId)?.content}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Education Section */}
        <Card>
          <CardHeader>
            <CardTitle>Education</CardTitle>
            <CardDescription>
              Select education entries to include
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search-edu">Search</Label>
              <Input
                id="search-edu"
                placeholder="Search by school or field..."
                value={eduSearchQuery}
                onChange={(e) => setEduSearchQuery(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedEducation.length} of {educations.length} selected
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredEducations.map(edu => (
                <div
                  key={edu.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-secondary/50"
                >
                  <Checkbox
                    id={`edu-${edu.id}`}
                    checked={selectedEducation.includes(edu.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedEducation([...selectedEducation, edu.id]);
                      } else {
                        setSelectedEducation(selectedEducation.filter(id => id !== edu.id));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {edu.degree_type} in {edu.field_of_study}
                    </div>
                    <p className="text-sm text-muted-foreground">{edu.school_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {edu.location} • {edu.grad_year}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Experience Section */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Experience</CardTitle>
            <CardDescription>
              Select experience entries to include
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {selectedExperience.length} of {experiences.length} selected
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredExperiences.map(exp => (
                <div
                  key={exp.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-secondary/50"
                >
                  <Checkbox
                    id={`exp-${exp.id}`}
                    checked={selectedExperience.includes(exp.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedExperience([...selectedExperience, exp.id]);
                      } else {
                        setSelectedExperience(selectedExperience.filter(id => id !== exp.id));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{exp.title}</div>
                    <p className="text-sm text-muted-foreground">{exp.institution}</p>
                    <p className="text-xs text-muted-foreground">
                      {exp.start_year} – {exp.end_year ? exp.end_year : 'Present'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Publications Section */}
        <Card>
          <CardHeader>
            <CardTitle>Publications</CardTitle>
            <CardDescription>
              Select 5 most closely related and 5 other significant publications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="search-pub"
                  placeholder="Search by DOI, title, authors, or journal..."
                  value={pubSearchQuery}
                  onChange={(e) => setPubSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-muted rounded-md">
                <div className="text-2xl font-bold">{relatedPublications.length}/5</div>
                <div className="text-sm text-muted-foreground">Most Closely Related</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-md">
                <div className="text-2xl font-bold">{otherPublications.length}/5</div>
                <div className="text-sm text-muted-foreground">Other Significant</div>
              </div>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredPublications.map(pub => {
                const isRelated = relatedPublications.includes(pub.id);
                const isOther = otherPublications.includes(pub.id);

                return (
                  <Card key={pub.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {pub.title && (
                          <h3 className="font-semibold text-slate-900 mb-1">{pub.title}</h3>
                        )}
                        {pub.authors && (
                          <p className="text-sm text-slate-600 mb-1">{pub.authors}</p>
                        )}
                        {pub.journal && (
                          <p className="text-sm text-slate-600 mb-1">
                            {pub.journal}
                            {pub.year && ` (${pub.year})`}
                            {pub.volume && `, Vol. ${pub.volume}`}
                            {pub.issue && `, Issue ${pub.issue}`}
                            {pub.pages && `, pp. ${pub.pages}`}
                          </p>
                        )}
                        {pub.citation && !pub.title && (
                          <p className="text-sm text-slate-700 mt-2 leading-relaxed">{pub.citation}</p>
                        )}
                        <p className="text-xs font-mono text-blue-600 break-all mt-2">{pub.doi}</p>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`related-${pub.id}`}
                            checked={isRelated}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                if (relatedPublications.length < 5 && !isOther) {
                                  setRelatedPublications([...relatedPublications, pub.id]);
                                }
                              } else {
                                setRelatedPublications(relatedPublications.filter(id => id !== pub.id));
                              }
                            }}
                            disabled={relatedPublications.length === 5 && !isRelated}
                          />
                          <Label htmlFor={`related-${pub.id}`} className="text-xs cursor-pointer">
                            Related ({relatedPublications.length}/5)
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`other-${pub.id}`}
                            checked={isOther}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                if (otherPublications.length < 5 && !isRelated) {
                                  setOtherPublications([...otherPublications, pub.id]);
                                }
                              } else {
                                setOtherPublications(otherPublications.filter(id => id !== pub.id));
                              }
                            }}
                            disabled={otherPublications.length === 5 && !isOther}
                          />
                          <Label htmlFor={`other-${pub.id}`} className="text-xs cursor-pointer">
                            Other ({otherPublications.length}/5)
                          </Label>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Generate Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleGenerate}
            disabled={!isFormValid || isGenerating}
            size="lg"
            className="min-w-48"
          >
            {isGenerating ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Generating...
              </>
            ) : (
              'Generate Biosketch PDF'
            )}
          </Button>
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Biosketch</DialogTitle>
            <DialogDescription>
              Enter a title for this biosketch. You'll be able to access it later from your dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="biosketch-title">Title</Label>
              <Input
                id="biosketch-title"
                placeholder="e.g., NIH Grant Application 2024"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && saveTitle.trim()) {
                    handleSave();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSaveDialog(false);
                setSaveTitle('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!saveTitle.trim() || isSaving}
            >
              {isSaving ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

