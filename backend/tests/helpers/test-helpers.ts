import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

/**
 * Clean up test database
 */
export async function cleanupDatabase() {
  await prisma.poolMember.deleteMany();
  await prisma.pool.deleteMany();
  await prisma.bankEntry.deleteMany();
  await prisma.shipCompliance.deleteMany();
  await prisma.route.deleteMany();
}

/**
 * Create test route data
 */
export async function createTestRoute(data: {
  routeId: string;
  vesselType?: string;
  fuelType?: string;
  year?: number;
  ghgIntensity?: number;
  fuelConsumption?: number;
  isBaseline?: boolean;
}) {
  return await prisma.route.create({
    data: {
      routeId: data.routeId,
      vesselType: data.vesselType || 'Container',
      fuelType: data.fuelType || 'HFO',
      year: data.year || 2025,
      ghgIntensity: data.ghgIntensity || 89.0,
      fuelConsumption: data.fuelConsumption || 5000,
      distance: 12000,
      totalEmissions: 4500,
      isBaseline: data.isBaseline || false,
    },
  });
}

/**
 * Create test compliance data
 */
export async function createTestCompliance(data: {
  shipId: string;
  year?: number;
  targetIntensity?: number;
  actualIntensity: number;
  fuelConsumption?: number;
}) {
  const targetIntensity = data.targetIntensity || 89.3368;
  const fuelConsumption = data.fuelConsumption || 5000;
  const energyInScope = fuelConsumption * 41000;
  const complianceBalance = (targetIntensity - data.actualIntensity) * energyInScope;

  return await prisma.shipCompliance.create({
    data: {
      shipId: data.shipId,
      year: data.year || 2025,
      targetIntensity,
      actualIntensity: data.actualIntensity,
      energyInScope,
      complianceBalance,
    },
  });
}

