import { ComplianceService } from '../../../src/core/application/services/ComplianceService';
import { ComplianceCalculation } from '../../../src/core/domain/entities/Compliance';

describe('ComplianceService - ComputeCB', () => {
  let complianceService: ComplianceService;
  const DEFAULT_TARGET = 89.3368;

  beforeEach(() => {
    complianceService = new ComplianceService();
  });

  describe('calculateEnergyInScope', () => {
    it('should calculate energy in scope correctly', () => {
      const fuelConsumption = 5000; // tonnes
      const result = complianceService.calculateEnergyInScope(fuelConsumption);
      expect(result).toBe(5000 * 41000); // 205,000,000 MJ
    });

    it('should handle zero fuel consumption', () => {
      const fuelConsumption = 0;
      const result = complianceService.calculateEnergyInScope(fuelConsumption);
      expect(result).toBe(0);
    });

    it('should handle decimal fuel consumption', () => {
      const fuelConsumption = 1234.56;
      const result = complianceService.calculateEnergyInScope(fuelConsumption);
      expect(result).toBeCloseTo(1234.56 * 41000, 2);
    });
  });

  describe('calculateComplianceBalance', () => {
    it('should calculate positive CB (surplus) when actual < target', () => {
      const calc: ComplianceCalculation = {
        fuelConsumption: 5000,
        targetIntensity: DEFAULT_TARGET,
        actualIntensity: 88.0, // Lower than target = surplus
      };

      const result = complianceService.calculateComplianceBalance(calc);
      
      expect(result.energyInScope).toBe(5000 * 41000);
      expect(result.targetIntensity).toBe(DEFAULT_TARGET);
      expect(result.actualIntensity).toBe(88.0);
      expect(result.complianceBalance).toBeGreaterThan(0); // Positive = surplus
      
      // Verify formula: CB = (Target - Actual) × EnergyInScope
      const expectedCB = (DEFAULT_TARGET - 88.0) * (5000 * 41000);
      expect(result.complianceBalance).toBeCloseTo(expectedCB, 2);
    });

    it('should calculate negative CB (deficit) when actual > target', () => {
      const calc: ComplianceCalculation = {
        fuelConsumption: 5000,
        targetIntensity: DEFAULT_TARGET,
        actualIntensity: 91.0, // Higher than target = deficit
      };

      const result = complianceService.calculateComplianceBalance(calc);
      
      expect(result.complianceBalance).toBeLessThan(0); // Negative = deficit
      
      // Verify formula
      const expectedCB = (DEFAULT_TARGET - 91.0) * (5000 * 41000);
      expect(result.complianceBalance).toBeCloseTo(expectedCB, 2);
    });

    it('should return zero CB when actual equals target', () => {
      const calc: ComplianceCalculation = {
        fuelConsumption: 5000,
        targetIntensity: DEFAULT_TARGET,
        actualIntensity: DEFAULT_TARGET,
      };

      const result = complianceService.calculateComplianceBalance(calc);
      expect(result.complianceBalance).toBe(0);
    });

    it('should use default target intensity when not provided', () => {
      const calc: ComplianceCalculation = {
        fuelConsumption: 5000,
        actualIntensity: 88.0,
      };

      const result = complianceService.calculateComplianceBalance(calc);
      expect(result.targetIntensity).toBe(DEFAULT_TARGET);
    });

    it('should handle edge case: very high fuel consumption', () => {
      const calc: ComplianceCalculation = {
        fuelConsumption: 100000,
        targetIntensity: DEFAULT_TARGET,
        actualIntensity: 90.0,
      };

      const result = complianceService.calculateComplianceBalance(calc);
      expect(result.energyInScope).toBe(100000 * 41000);
      expect(result.complianceBalance).toBeLessThan(0); // Deficit
    });
  });
});

