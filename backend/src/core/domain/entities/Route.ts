export interface Route {
  id: string;
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  isBaseline: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RouteComparison {
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  baseline: number;
  comparison: number;
  percentDiff: number;
  compliant: boolean;
}

