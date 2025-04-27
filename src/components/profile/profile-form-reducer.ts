import { Profile } from "@/types";

export type ProfileFormState = {
  age: string;
  hasMajorIllness: boolean;
  hasInjury: boolean;
  hasConsistentTraining: boolean;
  hasAdvancedTraining: boolean;
  mafHR: number | null;
};

export type ProfileFormAction = 
  | { type: 'SET_AGE', value: string }
  | { type: 'SET_MAJOR_ILLNESS', value: boolean }
  | { type: 'SET_INJURY', value: boolean }
  | { type: 'SET_CONSISTENT_TRAINING', value: boolean }
  | { type: 'SET_ADVANCED_TRAINING', value: boolean }
  | { type: 'SET_MAF_HR', value: number | null }
  | { type: 'INITIALIZE', profile: Profile }
  | { type: 'RESET' };

const initialState: ProfileFormState = {
  age: '',
  hasMajorIllness: false,
  hasInjury: false,
  hasConsistentTraining: false,
  hasAdvancedTraining: false,
  mafHR: null
};

/**
 * Reducer for managing profile form state
 */
export function profileFormReducer(state: ProfileFormState, action: ProfileFormAction): ProfileFormState {
  console.log('Reducer action:', action.type, action);
  
  switch (action.type) {
    case 'SET_AGE':
      return { ...state, age: action.value };
      
    case 'SET_MAJOR_ILLNESS':
      return { 
        ...state, 
        hasMajorIllness: action.value,
        // Mutually exclusive options
        ...(action.value ? {
          hasConsistentTraining: false,
          hasAdvancedTraining: false
        } : {})
      };
      
    case 'SET_INJURY':
      return { 
        ...state, 
        hasInjury: action.value,
        // Mutually exclusive options
        ...(action.value ? {
          hasConsistentTraining: false,
          hasAdvancedTraining: false
        } : {})
      };
      
    case 'SET_CONSISTENT_TRAINING':
      // Can't enable this if major illness or injury is true
      if (action.value && (state.hasMajorIllness || state.hasInjury)) {
        return state;
      }
      return { ...state, hasConsistentTraining: action.value };
      
    case 'SET_ADVANCED_TRAINING':
      // Can't enable this if major illness or injury is true
      if (action.value && (state.hasMajorIllness || state.hasInjury)) {
        return state;
      }
      return { ...state, hasAdvancedTraining: action.value };
      
    case 'SET_MAF_HR':
      return { ...state, mafHR: action.value };
      
    case 'INITIALIZE':
      return {
        age: action.profile.age?.toString() || '',
        hasMajorIllness: action.profile.has_major_illness,
        hasInjury: action.profile.has_injury,
        hasConsistentTraining: action.profile.has_consistent_training,
        hasAdvancedTraining: action.profile.has_advanced_training,
        mafHR: action.profile.maf_hr || null
      };
      
    case 'RESET':
      return initialState;
      
    default:
      return state;
  }
} 