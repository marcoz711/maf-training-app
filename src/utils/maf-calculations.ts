/**
 * Calculate Maximum Aerobic Function (MAF) Heart Rate based on user profile
 */
export function calculateMafHR(age: number, profile: {
  hasMajorIllness: boolean;
  hasInjury: boolean;
  hasConsistentTraining: boolean;
  hasAdvancedTraining: boolean;
}) {
  if (age < 16) return 165; // Rule for users under 16

  let baseHR = 180 - age;
  if (profile.hasMajorIllness) baseHR -= 10;
  if (profile.hasInjury) baseHR -= 5;
  if (profile.hasConsistentTraining) baseHR += 0; // No change
  if (profile.hasAdvancedTraining) baseHR += 5;

  return baseHR;
}

/**
 * Validate profile selections for logical consistency
 */
export function validateProfileSelections(profile: {
  hasMajorIllness: boolean;
  hasInjury: boolean;
  hasConsistentTraining: boolean;
  hasAdvancedTraining: boolean;
}) {
  if ((profile.hasMajorIllness || profile.hasInjury) && 
      (profile.hasConsistentTraining || profile.hasAdvancedTraining)) {
    return "You cannot select 'Yes' for both training consistently/advanced training and having an illness or injury.";
  }
  return null;
}

/**
 * Get warning message for age-related considerations
 */
export function getAgeWarning(age: number): string | null {
  if (age >= 65) {
    return "Warning: The MAF 180 Formula may need further adjustment for athletes over 65. Please assess your situation or contact support.";
  }
  return null;
} 