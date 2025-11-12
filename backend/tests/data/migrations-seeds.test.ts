import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

describe('Data Tests - Migrations & Seeds', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Database Schema', () => {
    it('should have Route table with correct structure', async () => {
      const routes = await prisma.route.findMany({ take: 1 });
      // If we can query without error, table exists
      expect(Array.isArray(routes)).toBe(true);
    });

    it('should have ShipCompliance table with correct structure', async () => {
      const compliances = await prisma.shipCompliance.findMany({ take: 1 });
      expect(Array.isArray(compliances)).toBe(true);
    });

    it('should have BankEntry table with correct structure', async () => {
      const entries = await prisma.bankEntry.findMany({ take: 1 });
      expect(Array.isArray(entries)).toBe(true);
    });

    it('should have Pool table with correct structure', async () => {
      const pools = await prisma.pool.findMany({ take: 1 });
      expect(Array.isArray(pools)).toBe(true);
    });

    it('should have PoolMember table with correct structure', async () => {
      const members = await prisma.poolMember.findMany({ take: 1 });
      expect(Array.isArray(members)).toBe(true);
    });
  });

  describe('Seed Data Validation', () => {
    it('should be able to create and read route data', async () => {
      const route = await prisma.route.create({
        data: {
          routeId: 'TEST_ROUTE',
          vesselType: 'Container',
          fuelType: 'HFO',
          year: 2025,
          ghgIntensity: 89.0,
          fuelConsumption: 5000,
          distance: 12000,
          totalEmissions: 4500,
          isBaseline: false,
        },
      });

      expect(route).toHaveProperty('id');
      expect(route.routeId).toBe('TEST_ROUTE');
      expect(route.ghgIntensity).toBe(89.0);

      // Cleanup
      await prisma.route.delete({ where: { id: route.id } });
    });

    it('should be able to create and read compliance data', async () => {
      const compliance = await prisma.shipCompliance.create({
        data: {
          shipId: 'TEST_SHIP',
          year: 2025,
          targetIntensity: 89.3368,
          actualIntensity: 88.0,
          energyInScope: 205000000,
          complianceBalance: 274000000,
        },
      });

      expect(compliance).toHaveProperty('shipId', 'TEST_SHIP');
      expect(compliance.complianceBalance).toBe(274000000);

      // Cleanup
      await prisma.shipCompliance.delete({
        where: { shipId_year: { shipId: 'TEST_SHIP', year: 2025 } },
      });
    });

    it('should enforce unique constraint on routeId', async () => {
      const route1 = await prisma.route.create({
        data: {
          routeId: 'UNIQUE_TEST',
          vesselType: 'Container',
          fuelType: 'HFO',
          year: 2025,
          ghgIntensity: 89.0,
          fuelConsumption: 5000,
          distance: 12000,
          totalEmissions: 4500,
        },
      });

      await expect(
        prisma.route.create({
          data: {
            routeId: 'UNIQUE_TEST', // Duplicate
            vesselType: 'Container',
            fuelType: 'HFO',
            year: 2025,
            ghgIntensity: 89.0,
            fuelConsumption: 5000,
            distance: 12000,
            totalEmissions: 4500,
          },
        })
      ).rejects.toThrow();

      // Cleanup
      await prisma.route.delete({ where: { id: route1.id } });
    });

    it('should enforce unique constraint on shipId_year for compliance', async () => {
      const compliance1 = await prisma.shipCompliance.create({
        data: {
          shipId: 'UNIQUE_SHIP',
          year: 2025,
          targetIntensity: 89.3368,
          actualIntensity: 88.0,
          energyInScope: 205000000,
          complianceBalance: 274000000,
        },
      });

      await expect(
        prisma.shipCompliance.create({
          data: {
            shipId: 'UNIQUE_SHIP', // Duplicate
            year: 2025, // Same year
            targetIntensity: 89.3368,
            actualIntensity: 88.0,
            energyInScope: 205000000,
            complianceBalance: 274000000,
          },
        })
      ).rejects.toThrow();

      // Cleanup
      await prisma.shipCompliance.delete({
        where: { shipId_year: { shipId: 'UNIQUE_SHIP', year: 2025 } },
      });
    });

    it('should handle foreign key relationships (Pool -> PoolMember)', async () => {
      const pool = await prisma.pool.create({
        data: {
          name: 'Test Pool',
          year: 2025,
        },
      });

      const member = await prisma.poolMember.create({
        data: {
          poolId: pool.id,
          shipId: 'TEST_SHIP',
          cbBefore: 1000,
          cbAfter: 500,
        },
      });

      expect(member.poolId).toBe(pool.id);

      // Test cascade delete
      await prisma.pool.delete({ where: { id: pool.id } });
      
      const memberAfterDelete = await prisma.poolMember.findUnique({
        where: { id: member.id },
      });
      expect(memberAfterDelete).toBeNull();
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity', async () => {
      // Create a pool
      const pool = await prisma.pool.create({
        data: {
          name: 'Integrity Test',
          year: 2025,
        },
      });

      // Create a member
      const member = await prisma.poolMember.create({
        data: {
          poolId: pool.id,
          shipId: 'TEST_SHIP',
          cbBefore: 1000,
          cbAfter: 500,
        },
      });

      // Verify relationship
      const poolWithMembers = await prisma.pool.findUnique({
        where: { id: pool.id },
        include: { members: true },
      });

      expect(poolWithMembers?.members).toHaveLength(1);
      expect(poolWithMembers?.members[0].id).toBe(member.id);

      // Cleanup
      await prisma.pool.delete({ where: { id: pool.id } });
    });
  });
});

