"use client";

import { FormSection } from '../form-section';
import { Button } from '@/components/ui/button';

interface HealthSectionProps {
  hasMajorIllness: boolean;
  hasInjury: boolean;
  onMajorIllnessChange: (value: boolean) => void;
  onInjuryChange: (value: boolean) => void;
}

export const HealthSection = ({
  hasMajorIllness,
  hasInjury,
  onMajorIllnessChange,
  onInjuryChange
}: HealthSectionProps) => {
  return (
    <>
      <FormSection
        title="Health Status"
        description="Please answer the following questions about your health status"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Are you recovering from a major illness (heart disease, any operation or hospital stay, etc.), are in rehabilitation, are on any regular medication, or are in Stage 3 (chronic) overtraining (burnout)?
            </label>
            <div className="flex gap-4">
              <Button 
                variant={hasMajorIllness ? "default" : "outline"} 
                onClick={() => onMajorIllnessChange(true)}
              >
                Yes
              </Button>
              <Button 
                variant={!hasMajorIllness ? "default" : "outline"} 
                onClick={() => onMajorIllnessChange(false)}
              >
                No
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Are you injured, have regressed or not improved in training (such as poor MAF Tests) or competition, get more than two colds, flu or other infections per year, have seasonal allergies or asthma, are overfat, are in Stage 1 or 2 of overtraining, or if you have been inconsistent, just starting, or just getting back into training?
            </label>
            <div className="flex gap-4">
              <Button 
                variant={hasInjury ? "default" : "outline"} 
                onClick={() => onInjuryChange(true)}
              >
                Yes
              </Button>
              <Button 
                variant={!hasInjury ? "default" : "outline"} 
                onClick={() => onInjuryChange(false)}
              >
                No
              </Button>
            </div>
          </div>
        </div>
      </FormSection>
    </>
  );
}; 