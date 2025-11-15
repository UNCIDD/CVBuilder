'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PersonalStatementStep } from './steps/personal-statement-step';
import { EducationStep } from './steps/education-step';
import { ExperienceStep } from './steps/experience-step';
import { PublicationsStep } from './steps/publications-step';
import { ReviewStep } from './steps/review-step';
import { StepIndicator } from './step-indicator';

type Step = 'statement' | 'education' | 'experience' | 'publications' | 'review';

export function BiosketechGenerator() {
  const [currentStep, setCurrentStep] = useState<Step>('statement');
  const [personalStatement, setPersonalStatement] = useState('');
  const [selectedEducation, setSelectedEducation] = useState<number[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<number[]>([]);
  const [relatedPublications, setRelatedPublications] = useState<number[]>([]);
  const [otherPublications, setOtherPublications] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const isStatementComplete = personalStatement.trim().length > 0;
  const isEducationComplete = selectedEducation.length > 0;
  const isExperienceComplete = selectedExperience.length > 0;
  const isPublicationsComplete = relatedPublications.length === 5 && otherPublications.length === 5;

  const steps: { id: Step; label: string; complete: boolean }[] = [
    { id: 'statement', label: 'Personal Statement', complete: isStatementComplete },
    { id: 'education', label: 'Education', complete: isEducationComplete },
    { id: 'experience', label: 'Experience', complete: isExperienceComplete },
    { id: 'publications', label: 'Publications', complete: isPublicationsComplete },
    { id: 'review', label: 'Review & Generate', complete: false },
  ];

  const handleNext = () => {
    const stepOrder: Step[] = ['statement', 'education', 'experience', 'publications', 'review'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const stepOrder: Step[] = ['statement', 'education', 'experience', 'publications', 'review'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'statement':
        return isStatementComplete;
      case 'education':
        return isEducationComplete;
      case 'experience':
        return isExperienceComplete;
      case 'publications':
        return isPublicationsComplete;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-foreground">Biosketch Generator</h1>
          <p className="text-muted-foreground mt-1">Create your professional biographical sketch in 5 easy steps</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step Indicator */}
        <StepIndicator steps={steps} currentStep={currentStep} />

        {/* Step Content */}
        <div className="mt-12">
          {currentStep === 'statement' && (
            <PersonalStatementStep value={personalStatement} onChange={setPersonalStatement} />
          )}

          {currentStep === 'education' && (
            <EducationStep
              selectedEducation={selectedEducation}
              onSelectionChange={setSelectedEducation}
            />
          )}

          {currentStep === 'experience' && (
            <ExperienceStep
              selectedExperience={selectedExperience}
              onSelectionChange={setSelectedExperience}
            />
          )}

          {currentStep === 'publications' && (
            <PublicationsStep
              relatedPublications={relatedPublications}
              otherPublications={otherPublications}
              onRelatedChange={setRelatedPublications}
              onOtherChange={setOtherPublications}
            />
          )}

          {currentStep === 'review' && (
            <ReviewStep
              personalStatement={personalStatement}
              selectedEducation={selectedEducation}
              selectedExperience={selectedExperience}
              relatedPublications={relatedPublications}
              otherPublications={otherPublications}
              isGenerating={isGenerating}
              onGenerating={setIsGenerating}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 justify-between mt-12">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 'statement'}
            size="lg"
          >
            Previous
          </Button>

          {currentStep !== 'review' && (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              size="lg"
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
