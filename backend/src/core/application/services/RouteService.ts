import { Route, RouteComparison } from '../../domain/entities/Route';

export class RouteService {
  /**
   * Calculate percentage difference between comparison and baseline
   * percentDiff = ((comparison / baseline) - 1) * 100
   */
  calculatePercentDiff(baseline: number, comparison: number): number {
    if (baseline === 0) return 0;
    return ((comparison / baseline) - 1) * 100;
  }

  /**
   * Check if comparison route is compliant
   * compliant = comparison <= target
   * For now, we'll use baseline as target
   */
  isCompliant(baseline: number, comparison: number): boolean {
    return comparison <= baseline;
  }

  /**
   * Compare routes against baseline
   */
  compareRoutes(baseline: Route, routes: Route[]): RouteComparison[] {
    return routes
      .filter(route => route.id !== baseline.id)
      .map(route => ({
        routeId: route.routeId,
        vesselType: route.vesselType,
        fuelType: route.fuelType,
        year: route.year,
        baseline: baseline.ghgIntensity,
        comparison: route.ghgIntensity,
        percentDiff: this.calculatePercentDiff(baseline.ghgIntensity, route.ghgIntensity),
        compliant: this.isCompliant(baseline.ghgIntensity, route.ghgIntensity),
      }));
  }
}

