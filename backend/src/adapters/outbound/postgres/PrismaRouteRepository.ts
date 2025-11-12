import { PrismaClient } from '@prisma/client';
import { Route } from '../../../core/domain/entities/Route';
import { RouteRepository } from '../../../core/ports/RouteRepository';

export class PrismaRouteRepository implements RouteRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(filters?: { vesselType?: string; fuelType?: string; year?: number }): Promise<Route[]> {
    const routes = await this.prisma.route.findMany({
      where: {
        ...(filters?.vesselType && { vesselType: filters.vesselType }),
        ...(filters?.fuelType && { fuelType: filters.fuelType }),
        ...(filters?.year && { year: filters.year }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return routes.map(this.toDomain);
  }

  async findById(id: string): Promise<Route | null> {
    const route = await this.prisma.route.findUnique({ where: { id } });
    return route ? this.toDomain(route) : null;
  }

  async findByRouteId(routeId: string): Promise<Route | null> {
    const route = await this.prisma.route.findUnique({ where: { routeId } });
    return route ? this.toDomain(route) : null;
  }

  async create(route: Omit<Route, 'id' | 'createdAt' | 'updatedAt'>): Promise<Route> {
    const created = await this.prisma.route.create({
      data: {
        routeId: route.routeId,
        vesselType: route.vesselType,
        fuelType: route.fuelType,
        year: route.year,
        ghgIntensity: route.ghgIntensity,
        fuelConsumption: route.fuelConsumption,
        distance: route.distance,
        totalEmissions: route.totalEmissions,
        isBaseline: route.isBaseline,
      },
    });

    return this.toDomain(created);
  }

  async update(id: string, updates: Partial<Route>): Promise<Route> {
    const updated = await this.prisma.route.update({
      where: { id },
      data: {
        ...(updates.routeId && { routeId: updates.routeId }),
        ...(updates.vesselType && { vesselType: updates.vesselType }),
        ...(updates.fuelType && { fuelType: updates.fuelType }),
        ...(updates.year && { year: updates.year }),
        ...(updates.ghgIntensity !== undefined && { ghgIntensity: updates.ghgIntensity }),
        ...(updates.fuelConsumption !== undefined && { fuelConsumption: updates.fuelConsumption }),
        ...(updates.distance !== undefined && { distance: updates.distance }),
        ...(updates.totalEmissions !== undefined && { totalEmissions: updates.totalEmissions }),
        ...(updates.isBaseline !== undefined && { isBaseline: updates.isBaseline }),
      },
    });

    return this.toDomain(updated);
  }

  async setBaseline(routeId: string): Promise<Route> {
    // First, unset all baselines
    await this.prisma.route.updateMany({
      where: { isBaseline: true },
      data: { isBaseline: false },
    });

    // Then set the new baseline
    const route = await this.prisma.route.findUnique({ where: { routeId } });
    if (!route) {
      throw new Error(`Route ${routeId} not found`);
    }

    const updated = await this.prisma.route.update({
      where: { routeId },
      data: { isBaseline: true },
    });

    return this.toDomain(updated);
  }

  async findBaseline(): Promise<Route | null> {
    const route = await this.prisma.route.findFirst({ where: { isBaseline: true } });
    return route ? this.toDomain(route) : null;
  }

  private toDomain(prismaRoute: any): Route {
    return {
      id: prismaRoute.id,
      routeId: prismaRoute.routeId,
      vesselType: prismaRoute.vesselType,
      fuelType: prismaRoute.fuelType,
      year: prismaRoute.year,
      ghgIntensity: prismaRoute.ghgIntensity,
      fuelConsumption: prismaRoute.fuelConsumption,
      distance: prismaRoute.distance,
      totalEmissions: prismaRoute.totalEmissions,
      isBaseline: prismaRoute.isBaseline,
      createdAt: prismaRoute.createdAt,
      updatedAt: prismaRoute.updatedAt,
    };
  }
}

