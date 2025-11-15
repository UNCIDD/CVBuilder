'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface PersonalStatementStepProps {
  value: string;
  onChange: (value: string) => void;
}

export function PersonalStatementStep({ value, onChange }: PersonalStatementStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Statement</CardTitle>
        <CardDescription>
          Write a brief biographical statement about yourself, your research interests, and key accomplishments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="statement">Your Statement</Label>
            <Textarea
              id="statement"
              placeholder="Tell us about your professional background, research interests, and accomplishments..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="min-h-48 resize-none"
            />
          </div>
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Character count: {value.length}</span>
            {value.trim().length > 0 && <span className="text-green-600 font-medium">✓ Complete</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
