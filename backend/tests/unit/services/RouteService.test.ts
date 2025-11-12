import { RouteService } from '../../../src/core/application/services/RouteService';
import { Route } from '../../../src/core/domain/entities/Route';

describe('RouteService - ComputeComparison', () => {
  let routeService: RouteService;

  beforeEach(() => {
    routeService = new RouteService();
  });

  describe('calculatePercentDiff', () => {
    it('should calculate positive percentage difference correctly', () => {
      const baseline = 89.0;
      const comparison = 91.0;
      const result = routeService.calculatePercentDiff(baseline, comparison);
      expect(result).toBeCloseTo(2.247, 2); // ((91/89) - 1) * 100
    });

    it('should calculate negative percentage difference correctly', () => {
      const baseline = 91.0;
      const comparison = 89.0;
      const result = routeService.calculatePercentDiff(baseline, comparison);
      expect(result).toBeCloseTo(-2.198, 2); // ((89/91) - 1) * 100
    });

    it('should return 0 when baseline is 0', () => {
      const baseline = 0;
      const comparison = 91.0;
      const result = routeService.calculatePercentDiff(baseline, comparison);
      expect(result).toBe(0);
    });

    it('should handle equal values', () => {
      const baseline = 89.0;
      const comparison = 89.0;
      const result = routeService.calculatePercentDiff(baseline, comparison);
      expect(result).toBe(0);
    });
  });

  describe('isCompliant', () => {
    it('should return true when comparison is less than baseline', () => {
      const baseline = 91.0;
      const comparison = 89.0;
      const result = routeService.isCompliant(baseline, comparison);
      expect(result).toBe(true);
    });

    it('should return true when comparison equals baseline', () => {
      const baseline = 89.0;
      const comparison = 89.0;
      const result = routeService.isCompliant(baseline, comparison);
      expect(result).toBe(true);
    });

    it('should return false when comparison is greater than baseline', () => {
      const baseline = 89.0;
      const comparison = 91.0;
      const result = routeService.isCompliant(baseline, comparison);
      expect(result).toBe(false);
    });
  });

  describe('compareRoutes', () => {
    it('should compare routes against baseline correctly', () => {
      const baseline: Route = {
        id: '1',
        routeId: 'R001',
        vesselType: 'Container',
        fuelType: 'HFO',
        year: 2025,
        ghgIntensity: 89.0,
        fuelConsumption: 5000,
        distance: 12000,
        totalEmissions: 4500,
        isBaseline: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const routes: Route[] = [
        {
          id: '2',
          routeId: 'R002',
          vesselType: 'BulkCarrier',
          fuelType: 'LNG',
          year: 2025,
          ghgIntensity: 91.0,
          fuelConsumption: 4800,
          distance: 11500,
          totalEmissions: 4200,
          isBaseline: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          routeId: 'R003',
          vesselType: 'Tanker',
          fuelType: 'MGO',
          year: 2025,
          ghgIntensity: 88.0,
          fuelConsumption: 5100,
          distance: 12500,
          totalEmissions: 4700,
          isBaseline: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const comparisons = routeService.compareRoutes(baseline, routes);

      expect(comparisons).toHaveLength(2);
      
      // R002 should be non-compliant (91.0 > 89.0)
      expect(comparisons[0].routeId).toBe('R002');
      expect(comparisons[0].compliant).toBe(false);
      expect(comparisons[0].percentDiff).toBeGreaterThan(0);

      // R003 should be compliant (88.0 < 89.0)
      expect(comparisons[1].routeId).toBe('R003');
      expect(comparisons[1].compliant).toBe(true);
      expect(comparisons[1].percentDiff).toBeLessThan(0);
    });

    it('should exclude baseline route from comparisons', () => {
      const baseline: Route = {
        id: '1',
        routeId: 'R001',
        vesselType: 'Container',
        fuelType: 'HFO',
        year: 2025,
        ghgIntensity: 89.0,
        fuelConsumption: 5000,
        distance: 12000,
        totalEmissions: 4500,
        isBaseline: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const routes: Route[] = [baseline];

      const comparisons = routeService.compareRoutes(baseline, routes);
      expect(comparisons).toHaveLength(0);
    });
  });
});

