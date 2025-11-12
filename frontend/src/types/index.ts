export interface Route {
  id: string
  routeId: string
  vesselType: string
  fuelType: string
  year: number
  ghgIntensity: number
  fuelConsumption: number
  distance: number
  totalEmissions: number
  isBaseline: boolean
  createdAt: string
  updatedAt: string
}

export interface RouteComparison {
  routeId: string
  vesselType: string
  fuelType: string
  year: number
  baseline: number
  comparison: number
  percentDiff: number
  compliant: boolean
}

export interface ComparisonResponse {
  baseline: {
    routeId: string
    ghgIntensity: number
  }
  comparisons: RouteComparison[]
}

export interface ComplianceBalance {
  shipId: string
  year: number
  targetIntensity: number
  actualIntensity: number
  energyInScope: number
  complianceBalance: number
}

export interface BankRecord {
  shipId: string
  year: number
  totalBanked: number
  totalApplied: number
  availableBalance: number
  entries: BankEntry[]
}

export interface BankEntry {
  id: string
  shipId: string
  year: number
  cbAmount: number
  entryType: 'BANK' | 'APPLY'
  description?: string
  createdAt: string
}

export interface Pool {
  id: string
  name?: string
  year: number
  createdAt: string
  members: PoolMember[]
}

export interface PoolMember {
  id: string
  poolId: string
  shipId: string
  cbBefore: number
  cbAfter: number
  createdAt: string
}

