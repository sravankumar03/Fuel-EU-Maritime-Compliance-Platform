import request from 'supertest';
import express from 'express';
import dotenv from 'dotenv';
import { prisma } from '../../src/infrastructure/db/prisma';
import { PrismaPoolRepository } from '../../src/adapters/outbound/postgres/PrismaPoolRepository';
import { PrismaComplianceRepository } from '../../src/adapters/outbound/postgres/PrismaComplianceRepository';
import { PoolService } from '../../src/core/application/services/PoolService';
import { createPoolRoutes } from '../../src/adapters/inbound/http/routes/poolRoutes';

// Load environment variables
dotenv.config();

describe('Pooling - Edge Cases', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    const poolRepository = new PrismaPoolRepository(prisma);
    const complianceRepository = new PrismaComplianceRepository(prisma);
    const poolService = new PoolService();
    app.use('/api/pools', createPoolRoutes(poolRepository, complianceRepository, poolService));
  });

  beforeEach(async () => {
    await prisma.poolMember.deleteMany();
    await prisma.pool.deleteMany();
    await prisma.shipCompliance.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Invalid Pool Edge Cases', () => {
    beforeEach(async () => {
      await prisma.shipCompliance.createMany({
        data: [
          {
            shipId: 'R001',
            year: 2025,
            targetIntensity: 89.3368,
            actualIntensity: 88.0,
            energyInScope: 205000000,
            complianceBalance: 274000000, // Positive (surplus)
          },
          {
            shipId: 'R002',
            year: 2025,
            targetIntensity: 89.3368,
            actualIntensity: 91.0,
            energyInScope: 196800000,
            complianceBalance: -327200000, // Negative (deficit)
          },
        ],
      });
    });

    it('should reject pool with negative sum', async () => {
      const response = await request(app)
        .post('/api/pools')
        .send({
          year: 2025,
          members: [
            { shipId: 'R001', adjustedCB: 100000 },
            { shipId: 'R002', adjustedCB: -200000 }, // Sum = -100000
          ],
        })
        .expect(400);

      expect(response.body.error).toContain('Pool validation failed');
      expect(response.body.details).toBeInstanceOf(Array);
      expect(response.body.details.length).toBeGreaterThan(0);
    });

    it('should reject if deficit ship exits worse', async () => {
      const response = await request(app)
        .post('/api/pools')
        .send({
          year: 2025,
          members: [
            { shipId: 'R002', adjustedCB: -400000000 }, // Was -327200000, now worse
          ],
        })
        .expect(400);

      expect(response.body.details.some((d: string) => d.includes('Deficit ship cannot exit worse'))).toBe(true);
    });

    it('should reject if surplus ship goes negative', async () => {
      const response = await request(app)
        .post('/api/pools')
        .send({
          year: 2025,
          members: [
            { shipId: 'R001', adjustedCB: -100000 }, // Was +274000000, now negative
          ],
        })
        .expect(400);

      expect(response.body.details.some((d: string) => d.includes('Surplus ship cannot go negative'))).toBe(true);
    });

    it('should reject pool with multiple validation errors', async () => {
      const response = await request(app)
        .post('/api/pools')
        .send({
          year: 2025,
          members: [
            { shipId: 'R001', adjustedCB: -100000 }, // Surplus going negative
            { shipId: 'R002', adjustedCB: -400000000 }, // Deficit getting worse
          ],
        })
        .expect(400);

      expect(response.body.details.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Edge Case: Zero Values', () => {
    beforeEach(async () => {
      await prisma.shipCompliance.create({
        data: {
          shipId: 'R001',
          year: 2025,
          targetIntensity: 89.3368,
          actualIntensity: 89.3368,
          energyInScope: 205000000,
          complianceBalance: 0,
        },
      });
    });

    it('should allow pool with zero sum', async () => {
      const response = await request(app)
        .post('/api/pools')
        .send({
          year: 2025,
          members: [
            { shipId: 'R001', adjustedCB: 0 },
          ],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });

  describe('Edge Case: Large Values', () => {
    beforeEach(async () => {
      await prisma.shipCompliance.create({
        data: {
          shipId: 'R001',
          year: 2025,
          targetIntensity: 89.3368,
          actualIntensity: 88.0,
          energyInScope: 205000000,
          complianceBalance: 274000000,
        },
      });
    });

    it('should handle very large CB values', async () => {
      const response = await request(app)
        .post('/api/pools')
        .send({
          year: 2025,
          members: [
            { shipId: 'R001', adjustedCB: 274000000 },
          ],
        })
        .expect(201);

      expect(response.body.members[0].cbAfter).toBe(274000000);
    });
  });

  describe('Edge Case: Single Ship Pool', () => {
    beforeEach(async () => {
      await prisma.shipCompliance.create({
        data: {
          shipId: 'R001',
          year: 2025,
          targetIntensity: 89.3368,
          actualIntensity: 88.0,
          energyInScope: 205000000,
          complianceBalance: 274000000,
        },
      });
    });

    it('should allow pool with single ship', async () => {
      const response = await request(app)
        .post('/api/pools')
        .send({
          year: 2025,
          members: [
            { shipId: 'R001', adjustedCB: 200000 },
          ],
        })
        .expect(201);

      expect(response.body.members).toHaveLength(1);
    });
  });
});

