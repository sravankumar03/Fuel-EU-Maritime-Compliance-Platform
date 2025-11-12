import { Route } from '../domain/entities/Route';

export interface RouteRepository {
  findAll(filters?: { vesselType?: string; fuelType?: string; year?: number }): Promise<Route[]>;
  findById(id: string): Promise<Route | null>;
  findByRouteId(routeId: string): Promise<Route | null>;
  create(route: Omit<Route, 'id' | 'createdAt' | 'updatedAt'>): Promise<Route>;
  update(id: string, updates: Partial<Route>): Promise<Route>;
  setBaseline(routeId: string): Promise<Route>;
  findBaseline(): Promise<Route | null>;
}

