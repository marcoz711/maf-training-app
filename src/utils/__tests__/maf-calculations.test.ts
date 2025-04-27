import { 
  calculateMafHR, 
  validateProfileSelections, 
  getAgeWarning 
} from '../maf-calculations';

describe('MAF Calculations', () => {
  describe('calculateMafHR', () => {
    it('should calculate correct MAF HR for healthy, untrained individual', () => {
      const age = 30;
      const selections = {
        hasMajorIllness: false,
        hasInjury: false,
        hasConsistentTraining: false,
        hasAdvancedTraining: false,
      };
      expect(calculateMafHR(age, selections)).toBe(150);
    });

    it('should subtract 5 BPM for major illness', () => {
      const age = 30;
      const selections = {
        hasMajorIllness: true,
        hasInjury: false,
        hasConsistentTraining: false,
        hasAdvancedTraining: false,
      };
      expect(calculateMafHR(age, selections)).toBe(145);
    });

    it('should subtract 5 BPM for injury', () => {
      const age = 30;
      const selections = {
        hasMajorIllness: false,
        hasInjury: true,
        hasConsistentTraining: false,
        hasAdvancedTraining: false,
      };
      expect(calculateMafHR(age, selections)).toBe(145);
    });

    it('should add 5 BPM for consistent training', () => {
      const age = 30;
      const selections = {
        hasMajorIllness: false,
        hasInjury: false,
        hasConsistentTraining: true,
        hasAdvancedTraining: false,
      };
      expect(calculateMafHR(age, selections)).toBe(155);
    });

    it('should add 10 BPM for advanced training', () => {
      const age = 30;
      const selections = {
        hasMajorIllness: false,
        hasInjury: false,
        hasConsistentTraining: false,
        hasAdvancedTraining: true,
      };
      expect(calculateMafHR(age, selections)).toBe(160);
    });
  });

  describe('validateProfileSelections', () => {
    it('should return null for valid selections', () => {
      const selections = {
        hasMajorIllness: false,
        hasInjury: false,
        hasConsistentTraining: true,
        hasAdvancedTraining: false,
      };
      expect(validateProfileSelections(selections)).toBeNull();
    });

    it('should return error message for invalid combination of training levels', () => {
      const selections = {
        hasMajorIllness: false,
        hasInjury: false,
        hasConsistentTraining: true,
        hasAdvancedTraining: true,
      };
      expect(validateProfileSelections(selections)).toBeTruthy();
    });

    it('should return error message for training with health issues', () => {
      const selections = {
        hasMajorIllness: true,
        hasInjury: false,
        hasConsistentTraining: true,
        hasAdvancedTraining: false,
      };
      expect(validateProfileSelections(selections)).toBeTruthy();
    });
  });

  describe('getAgeWarning', () => {
    it('should return null for valid age', () => {
      expect(getAgeWarning(30)).toBeNull();
    });

    it('should return warning for age below 16', () => {
      expect(getAgeWarning(15)).toBeTruthy();
    });

    it('should return warning for age above 80', () => {
      expect(getAgeWarning(81)).toBeTruthy();
    });
  });
}); 