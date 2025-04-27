"use client";

import { FormSection } from '../form-section';
import { Button } from '@/components/ui/button';

interface TrainingSectionProps {
  hasConsistentTraining: boolean;
  hasAdvancedTraining: boolean;
  hasMajorIllness: boolean;
  hasInjury: boolean;
  onConsistentTrainingChange: (value: boolean) => void;
  onAdvancedTrainingChange: (value: boolean) => void;
}

export const TrainingSection = ({
  hasConsistentTraining,
  hasAdvancedTraining,
  hasMajorIllness,
  hasInjury,
  onConsistentTrainingChange,
  onAdvancedTrainingChange
}: TrainingSectionProps) => {
  const isDisabled = hasMajorIllness || hasInjury;

  return (
    <FormSection
      title="Training History"
      description="Please answer the following questions about your training history"
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Have you been training consistently (4+ times per week) for <b>up to 2 years</b> without any of the problems mentioned above?
          </label>
          <div className="flex gap-4">
            <Button 
              variant={hasConsistentTraining ? "default" : "outline"} 
              onClick={() => onConsistentTrainingChange(true)}
              disabled={isDisabled}
            >
              Yes
            </Button>
            <Button 
              variant={!hasConsistentTraining ? "default" : "outline"} 
              onClick={() => onConsistentTrainingChange(false)}
            >
              No
            </Button>
          </div>
          {isDisabled && (
            <p className="text-sm text-gray-500 mt-2">
              This option is disabled because you indicated health concerns above.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Have you been training for <b>more than 2 years</b> without any of the problems listed above, have made progress in your MAF Tests, improved competitively and are without injury?
          </label>
          <div className="flex gap-4">
            <Button 
              variant={hasAdvancedTraining ? "default" : "outline"} 
              onClick={() => onAdvancedTrainingChange(true)}
              disabled={isDisabled}
            >
              Yes
            </Button>
            <Button 
              variant={!hasAdvancedTraining ? "default" : "outline"} 
              onClick={() => onAdvancedTrainingChange(false)}
            >
              No
            </Button>
          </div>
          {isDisabled && (
            <p className="text-sm text-gray-500 mt-2">
              This option is disabled because you indicated health concerns above.
            </p>
          )}
        </div>
      </div>
    </FormSection>
  );
}; 