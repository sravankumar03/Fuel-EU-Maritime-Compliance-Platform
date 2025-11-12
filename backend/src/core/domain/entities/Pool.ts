export interface Pool {
  id: string;
  name?: string;
  year: number;
  createdAt: Date;
  members: PoolMember[];
}

export interface PoolMember {
  id: string;
  poolId: string;
  shipId: string;
  cbBefore: number;
  cbAfter: number;
  createdAt: Date;
}

export interface PoolCreationRequest {
  name?: string;
  year: number;
  members: {
    shipId: string;
    adjustedCB: number;
  }[];
}

export interface PoolValidationResult {
  valid: boolean;
  errors: string[];
  cbBefore: Record<string, number>;
  cbAfter: Record<string, number>;
}

