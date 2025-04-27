"use client";

import { memo } from 'react';
import { FormSection } from '../form-section';

interface MAFDisplayProps {
  mafHR: number | null;
}

export const MAFDisplay = memo(function MAFDisplay({ mafHR }: MAFDisplayProps) {
  if (mafHR === null) return null;
  
  return (
    <FormSection
      title="Your MAF Heart Rate"
      description="This is your calculated Maximum Aerobic Function Heart Rate"
    >
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-lg text-green-800">
          <strong>{mafHR} BPM</strong>
        </p>
      </div>
    </FormSection>
  );
}); 