"use client";

import { FormSection } from '../form-section';
import { getAgeWarning } from '@/utils/maf-calculations';
import { useState } from 'react';
import { useProfile } from '@/hooks/use-profile';
import { Input } from '@/components/ui/input';

interface AgeSectionProps {
  age: string;
  warning: string | null;
  onAgeChange: (value: string) => void;
  onWarningChange: (warning: string | null) => void;
}

export const AgeSection = ({ 
  age, 
  warning, 
  onAgeChange, 
  onWarningChange 
}: AgeSectionProps) => {
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAge = e.target.value;
    onAgeChange(newAge);
    
    if (newAge) {
      const ageWarning = getAgeWarning(Number(newAge));
      onWarningChange(ageWarning);
    } else {
      onWarningChange(null);
    }
  };

  return (
    <FormSection
      title="Age"
      description="Enter your age to calculate your MAF Heart Rate"
    >
      <input
        type="number"
        value={age}
        onChange={handleAgeChange}
        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        min="1"
        max="120"
      />
      {warning && <p className="text-yellow-500 mt-2">{warning}</p>}
    </FormSection>
  );
}; 