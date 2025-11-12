export interface ComplianceBalance {
  shipId: string;
  year: number;
  targetIntensity: number;
  actualIntensity: number;
  energyInScope: number; // MJ
  complianceBalance: number; // CB value
}

export interface ComplianceCalculation {
  fuelConsumption: number; // tonnes
  targetIntensity: number; // gCO2e/MJ (default: 89.3368 for 2025)
  actualIntensity: number; // gCO2e/MJ
}

