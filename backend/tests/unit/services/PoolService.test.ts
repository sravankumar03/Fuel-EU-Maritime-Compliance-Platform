import { PoolService } from '../../../src/core/application/services/PoolService';
import { PoolCreationRequest } from '../../../src/core/domain/entities/Pool';

describe('PoolService - CreatePool Validation', () => {
  let poolService: PoolService;

  beforeEach(() => {
    poolService = new PoolService();
  });

  describe('validatePool', () => {
    it('should validate a valid pool with positive sum', () => {
      const request: PoolCreationRequest = {
        year: 2025,
        members: [
          { shipId: 'R001', adjustedCB: 1000 },
          { shipId: 'R002', adjustedCB: 500 },
        ],
      };

      const cbBefore = {
        R001: 1000,
        R002: 500,
      };

      const result = poolService.validatePool(request, cbBefore);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.cbBefore).toEqual(cbBefore);
      expect(result.cbAfter.R001).toBe(1000);
      expect(result.cbAfter.R002).toBe(500);
    });

    it('should validate a valid pool with zero sum', () => {
      const request: PoolCreationRequest = {
        year: 2025,
        members: [
          { shipId: 'R001', adjustedCB: 1000 },
          { shipId: 'R002', adjustedCB: -1000 },
        ],
      };

      const cbBefore = {
        R001: 1000,
        R002: -1000,
      };

      const result = poolService.validatePool(request, cbBefore);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject pool with negative sum', () => {
      const request: PoolCreationRequest = {
        year: 2025,
        members: [
          { shipId: 'R001', adjustedCB: 500 },
          { shipId: 'R002', adjustedCB: -1000 },
        ],
      };

      const cbBefore = {
        R001: 1000,
        R002: -500,
      };

      const result = poolService.validatePool(request, cbBefore);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Sum of adjusted CB');
      expect(result.errors[0]).toContain('must be ≥ 0');
    });

    it('should reject if deficit ship exits worse', () => {
      const request: PoolCreationRequest = {
        year: 2025,
        members: [
          { shipId: 'R001', adjustedCB: -1500 }, // Was -1000, now -1500 (worse)
        ],
      };

      const cbBefore = {
        R001: -1000, // Deficit ship
      };

      const result = poolService.validatePool(request, cbBefore);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('Deficit ship cannot exit worse'))).toBe(true);
    });

    it('should allow deficit ship to improve', () => {
      const request: PoolCreationRequest = {
        year: 2025,
        members: [
          { shipId: 'R001', adjustedCB: -500 }, // Was -1000, now -500 (better)
          { shipId: 'R002', adjustedCB: 600 }, // Add positive to make sum ≥ 0
        ],
      };

      const cbBefore = {
        R001: -1000, // Deficit ship
        R002: 1000, // Surplus ship
      };

      const result = poolService.validatePool(request, cbBefore);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject if surplus ship goes negative', () => {
      const request: PoolCreationRequest = {
        year: 2025,
        members: [
          { shipId: 'R001', adjustedCB: -500 }, // Was +1000, now -500 (went negative)
        ],
      };

      const cbBefore = {
        R001: 1000, // Surplus ship
      };

      const result = poolService.validatePool(request, cbBefore);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('Surplus ship cannot go negative'))).toBe(true);
    });

    it('should allow surplus ship to remain positive', () => {
      const request: PoolCreationRequest = {
        year: 2025,
        members: [
          { shipId: 'R001', adjustedCB: 500 }, // Was +1000, now +500 (still positive)
        ],
      };

      const cbBefore = {
        R001: 1000, // Surplus ship
      };

      const result = poolService.validatePool(request, cbBefore);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle multiple validation errors', () => {
      const request: PoolCreationRequest = {
        year: 2025,
        members: [
          { shipId: 'R001', adjustedCB: -500 }, // Surplus going negative
          { shipId: 'R002', adjustedCB: -1500 }, // Deficit getting worse
        ],
      };

      const cbBefore = {
        R001: 1000, // Surplus
        R002: -1000, // Deficit
      };

      const result = poolService.validatePool(request, cbBefore);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle edge case: zero CB before and after', () => {
      const request: PoolCreationRequest = {
        year: 2025,
        members: [
          { shipId: 'R001', adjustedCB: 0 },
        ],
      };

      const cbBefore = {
        R001: 0,
      };

      const result = poolService.validatePool(request, cbBefore);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

