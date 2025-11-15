interface Step {
  id: string;
  label: string;
  complete: boolean;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: string;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="relative">
      {/* Progress Bar */}
      <div className="absolute top-5 left-0 right-0 h-1 bg-border rounded-full">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{
            width: `${((currentIndex + 1) / steps.length) * 100}%`,
          }}
        />
      </div>

      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const isComplete = step.complete;
          const isCurrent = step.id === currentStep;
          const isPassed = index < currentIndex;

          return (
            <div key={step.id} className="flex flex-col items-center">
              {/* Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                    : isComplete || isPassed
                    ? 'bg-primary/80 text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {isComplete || isPassed ? '✓' : index + 1}
              </div>

              {/* Label */}
              <span
                className={`mt-3 text-sm font-medium text-center max-w-20 ${
                  isCurrent ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
