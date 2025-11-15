'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface PersonalStatementSectionProps {
  value: string;
  onChange: (value: string) => void;
}

export function PersonalStatementSection({ value, onChange }: PersonalStatementSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Statement</CardTitle>
        <CardDescription>
          Write a brief biographical statement about yourself. This will be included in your biosketch.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="statement">Your Statement</Label>
            <Textarea
              id="statement"
              placeholder="Enter your personal statement here. Tell us about your professional background, research interests, and accomplishments..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="min-h-48 resize-none"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Character count: {value.length}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
