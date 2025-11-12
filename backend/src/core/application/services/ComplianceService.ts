import { ComplianceBalance, ComplianceCalculation } from '../../domain/entities/Compliance';

export class ComplianceService {
  private readonly ENERGY_CONVERSION_FACTOR = 41000; // MJ per tonne of fuel
  private readonly DEFAULT_TARGET_INTENSITY = 89.3368; // gCO2e/MJ for 2025

  /**
   * Calculate Energy in Scope (MJ)
   * EnergyInScope = fuelConsumption × 41,000
   */
  calculateEnergyInScope(fuelConsumption: number): number {
    return fuelConsumption * this.ENERGY_CONVERSION_FACTOR;
  }

  /**
   * Calculate Compliance Balance (CB)
   * CB = (Target - Actual) × EnergyInScope
   * Positive CB = surplus, Negative CB = deficit
   */
  calculateComplianceBalance(calc: ComplianceCalculation): ComplianceBalance {
    const energyInScope = this.calculateEnergyInScope(calc.fuelConsumption);
    const targetIntensity = calc.targetIntensity || this.DEFAULT_TARGET_INTENSITY;
    const complianceBalance = (targetIntensity - calc.actualIntensity) * energyInScope;

    return {
      shipId: '', // Will be set by caller
      year: 0, // Will be set by caller
      targetIntensity,
      actualIntensity: calc.actualIntensity,
      energyInScope,
      complianceBalance,
    };
  }
}

