import { PoolCreationRequest, PoolValidationResult } from '../../domain/entities/Pool';

export class PoolService {
  /**
   * Validate pool creation rules:
   * 1. Sum(adjustedCB) ≥ 0
   * 2. Deficit ship cannot exit worse
   * 3. Surplus ship cannot go negative
   */
  validatePool(request: PoolCreationRequest, cbBefore: Record<string, number>): PoolValidationResult {
    const errors: string[] = [];
    const cbAfter: Record<string, number> = {};

    // Calculate sum of adjusted CB
    const sumAdjustedCB = request.members.reduce((sum, member) => sum + member.adjustedCB, 0);
    
    if (sumAdjustedCB < 0) {
      errors.push(`Sum of adjusted CB (${sumAdjustedCB}) must be ≥ 0`);
    }

    // Validate each member
    for (const member of request.members) {
      const before = cbBefore[member.shipId] || 0;
      const after = member.adjustedCB;
      cbAfter[member.shipId] = after;

      // Rule: Deficit ship (negative CB) cannot exit worse
      if (before < 0 && after < before) {
        errors.push(`Ship ${member.shipId}: Deficit ship cannot exit worse (${before} → ${after})`);
      }

      // Rule: Surplus ship (positive CB) cannot go negative
      if (before > 0 && after < 0) {
        errors.push(`Ship ${member.shipId}: Surplus ship cannot go negative (${before} → ${after})`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      cbBefore,
      cbAfter,
    };
  }
}

